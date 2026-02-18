// Run with: node scripts/migrate_portfolio.js
const admin = require('firebase-admin');
const serviceAccount = require('../service-account-key.json');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// NEW: Configuration
const CONFIG = {
    dryRun: true, // Set to false to actually migrate
    batchSize: 500, // Firestore batch limit
    logLevel: 'verbose' // 'verbose' or 'silent'
};

async function migratePortfolioToSubcollection() {
    console.log('🚀 Starting Migration: Portfolio Field -> Subcollection');
    console.log(`Mode: ${CONFIG.dryRun ? 'DRY RUN' : 'LIVE MIGRATION'}`);

    const usersSnapshot = await db.collection('users').get();
    let processedCount = 0;
    let migratedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    // NEW: Process in batches
    const batches = [];
    let currentBatch = db.batch();
    let operationsInBatch = 0;

    for (const userDoc of usersSnapshot.docs) {
        processedCount++;
        const userData = userDoc.data();
        const userId = userDoc.id;

        // NEW: Skip if already migrated
        if (userData.migrationStatus === 'completed_v1') {
            if (CONFIG.logLevel === 'verbose') {
                console.log(`⏭️  User ${userId} already migrated, skipping`);
            }
            skippedCount++;
            continue;
        }

        // Check if user has legacy portfolio field
        if (!userData.portfolio || !Array.isArray(userData.portfolio.holdings)) {
            if (CONFIG.logLevel === 'verbose') {
                console.log(`⏭️  User ${userId} has no portfolio, skipping`);
            }
            skippedCount++;
            continue;
        }

        try {
            console.log(`✏️  Processing user: ${userId}`);

            // NEW: Validate data before migration
            if (userData.portfolio.holdings.length > 1000) {
                console.warn(`⚠️  User ${userId} has ${userData.portfolio.holdings.length} holdings (very large!)`);
            }

            // Create new document in subcollection
            const newPortfolioRef = db.collection('users').doc(userId)
                .collection('portfolio-data').doc('main');

            currentBatch.set(newPortfolioRef, {
                ...userData.portfolio,
                migratedAt: admin.firestore.FieldValue.serverTimestamp()
            });

            // Remove the field from user root doc
            const userRef = db.collection('users').doc(userId);
            currentBatch.update(userRef, {
                portfolio: admin.firestore.FieldValue.delete(),
                migrationStatus: 'completed_v1',
                migratedAt: admin.firestore.FieldValue.serverTimestamp()
            });

            operationsInBatch += 2; // 2 operations per user
            migratedCount++;

            // NEW: Commit batch when it reaches limit
            if (operationsInBatch >= CONFIG.batchSize) {
                batches.push(currentBatch);
                currentBatch = db.batch();
                operationsInBatch = 0;
            }

        } catch (error) {
            console.error(`❌ Error processing user ${userId}:`, error);
            errorCount++;
        }
    }

    // Add remaining operations
    if (operationsInBatch > 0) {
        batches.push(currentBatch);
    }

    // NEW: Summary before commit
    console.log('\n📊 Migration Summary:');
    console.log(`   Total users processed: ${processedCount}`);
    console.log(`   To be migrated: ${migratedCount}`);
    console.log(`   Skipped (already migrated): ${skippedCount}`);
    console.log(`   Errors: ${errorCount}`);
    console.log(`   Total batches: ${batches.length}`);

    // NEW: Dry run protection
    if (CONFIG.dryRun) {
        console.log('\n⚠️  DRY RUN MODE - No changes made');
        console.log('Set CONFIG.dryRun = false to execute migration');
        return;
    }

    // NEW: Commit all batches with progress
    if (batches.length > 0) {
        console.log('\n🔄 Committing batches...');
        for (let i = 0; i < batches.length; i++) {
            await batches[i].commit();
            console.log(`   Batch ${i + 1}/${batches.length} committed`);
        }
        console.log(`\n✅ Migration complete! ${migratedCount} users migrated successfully.`);
    } else {
        console.log('\n✅ No users needed migration.');
    }

    // NEW: Create backup record
    if (!CONFIG.dryRun && migratedCount > 0) {
        await db.collection('_migrations').add({
            type: 'portfolio_to_subcollection',
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
            usersProcessed: processedCount,
            usersMigrated: migratedCount,
            usersSkipped: skippedCount,
            errors: errorCount
        });
        console.log('📝 Migration record saved to _migrations collection');
    }
}

// NEW: Rollback function (in case something goes wrong)
async function rollbackMigration() {
    console.log('🔄 Starting rollback...');

    const usersSnapshot = await db.collection('users')
        .where('migrationStatus', '==', 'completed_v1')
        .get();

    let count = 0;

    for (const userDoc of usersSnapshot.docs) {
        const userId = userDoc.id;

        // Get data from subcollection
        const portfolioDoc = await db.collection('users').doc(userId)
            .collection('portfolio-data').doc('main').get();

        if (portfolioDoc.exists) {
            const portfolioData = portfolioDoc.data();
            delete portfolioData.migratedAt; // Remove migration timestamp

            // Restore to main document
            await db.collection('users').doc(userId).update({
                portfolio: portfolioData,
                migrationStatus: admin.firestore.FieldValue.delete()
            });

            // Delete subcollection doc
            await portfolioDoc.ref.delete();

            count++;
            console.log(`Rolled back user: ${userId}`);
        }
    }

    console.log(`✅ Rollback complete. ${count} users restored.`);
}

// Main execution
const command = process.argv[2];

if (command === 'rollback') {
    rollbackMigration().catch(console.error);
} else {
    migratePortfolioToSubcollection().catch(console.error);
}
