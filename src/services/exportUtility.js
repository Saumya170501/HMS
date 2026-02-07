
/**
 * Convert JSON data to CSV format
 * @param {Array} data - Array of objects to convert
 * @param {Array} columns - Optional array of column names (keys) to include
 */
export const convertToCSV = (data, columns = null) => {
    if (!data || !data.length) return '';

    // If no columns specified, use all keys from the first object
    const headers = columns || Object.keys(data[0]);

    // Create header row
    const csvContent = [
        headers.join(','),
        ...data.map(row => headers.map(fieldName => {
            const value = row[fieldName];
            // Handle strings with commas or quotes
            if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
                return `"${value.replace(/"/g, '""')}"`;
            }
            return value;
        }).join(','))
    ].join('\n');

    return csvContent;
};

/**
 * Trigger a file download in the browser
 * @param {string} content - The content of the file
 * @param {string} fileName - The name of the file
 * @param {string} mimeType - The MIME type of the file
 */
export const downloadFile = (content, fileName, mimeType) => {
    const blob = new Blob([content], { type: mimeType });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = url;
    link.download = fileName;

    // Append to body, click, and remove
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    window.URL.revokeObjectURL(url);
};

/**
 * Export data based on user preferences
 * @param {Array} data - Data to export
 * @param {string} filename - Base filename (without extension)
 * @param {string} format - 'csv' or 'json'
 */
export const exportData = (data, filename, format = 'csv') => {
    const timestamp = new Date().toISOString().split('T')[0];
    const fullFilename = `${filename}_${timestamp}.${format}`;

    if (format === 'json') {
        const jsonContent = JSON.stringify(data, null, 2);
        downloadFile(jsonContent, fullFilename, 'application/json');
    } else {
        const csvContent = convertToCSV(data);
        downloadFile(csvContent, fullFilename, 'text/csv');
    }
};
