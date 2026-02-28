/**
 * Formats an array of chart data objects to include a `formattedDate` string
 * optimized for Recharts XAxis readability.
 * 
 * Formatting rules based on timeframe:
 * - 1W / 1M / 3M: "DD/MM" (e.g., 14/02)
 * - 1Y: "Jan 26" for the first tick of a new year, then just month ("Feb", "Mar", etc.)
 * - Default (no timeframe): "DD/MM" with "MMM YY" on year change
 * 
 * @param {Array} data - Array of chart data objects
 * @param {string} dateKey - The key in each object that holds the date string
 * @param {string} [timeframe] - Optional timeframe hint: '1W', '1M', '3M', '1Y'
 * @returns {Array} - New array with `formattedDate` added to each object
 */
export const withFormattedDates = (data, dateKey = 'date', timeframe = '') => {
    let currentYear = null;

    return data.map((item) => {
        const dateStr = item[dateKey];
        if (!dateStr) return { ...item, formattedDate: '' };

        // Handle "Day X" labels for what-if scenarios
        if (dateStr.toString().startsWith('Day')) {
            return { ...item, formattedDate: dateStr };
        }

        const d = new Date(dateStr);
        if (isNaN(d)) return { ...item, formattedDate: dateStr };

        const year = d.getFullYear();
        const shortYear = year.toString().slice(-2);
        const monthShort = d.toLocaleDateString('en-US', { month: 'short' }); // "Jan", "Feb"
        const day = d.getDate().toString().padStart(2, '0');
        const month = (d.getMonth() + 1).toString().padStart(2, '0');

        let formattedDate;
        const tf = timeframe.toUpperCase();

        if (tf === '1Y') {
            // Yearly view: "Jan 26" on year change, then just month names
            if (year !== currentYear) {
                currentYear = year;
                formattedDate = `${monthShort} ${shortYear}`;
            } else {
                formattedDate = monthShort;
            }
        } else {
            // Weekly / Monthly / 3-Month / Default: DD/MM, with year marker on change
            if (year !== currentYear) {
                currentYear = year;
                // Show year marker for first point or year transitions
                if (tf === '1W' || tf === '1M' || tf === '3M') {
                    formattedDate = `${day}/${month}`;
                } else {
                    formattedDate = `${day}/${month}/${shortYear}`;
                }
            } else {
                formattedDate = `${day}/${month}`;
            }
        }

        return {
            ...item,
            formattedDate
        };
    });
};
