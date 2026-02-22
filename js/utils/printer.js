/**
 * Printer Utility - Standardizes reporting and printing across SHOPLEASE.
 * Ensures consistent branding, layout, and reliable print window behavior.
 */
const Printer = {
    /**
     * Prints HTML content in an isolated window with SUDA branding.
     * @param {string} contentHtml - The inner HTML to print.
     * @param {string} title - The window/document title.
     * @param {object} options - Configuration options.
     * @param {string} [options.styles] - Extra CSS styles.
     * @param {boolean} [options.isBatch] - If true, treats content as multiple pages.
     * @param {boolean} [options.showBranding=true] - Whether to show SUDA header/footer.
     */
    print(contentHtml, title = 'Report', options = {}) {
        const printWindow = window.open('', '_blank', 'width=1000,height=800');
        if (!printWindow) {
            alert("Pop-up blocked! Please allow pop-ups to print reports.");
            return;
        }

        if (options.raw) {
            const rawHtml = `
<!DOCTYPE html>
<html>
<head>
    <title>${title}</title>
    ${options.styles || options.customCSS || ''}
</head>
<body style="margin: 0; padding: 0;">
    ${contentHtml}
    <script>
        window.onload = function() {
            setTimeout(() => {
                window.print();
                window.onafterprint = () => window.close();
            }, 500);
        };
    </script>
</body>
</html>`;
            printWindow.document.write(rawHtml);
            printWindow.document.close();
            return;
        }

        const settings = window.Store ? window.Store.getSettings() : {};
        const logoUrl = settings.logoUrl || 'assets/logo.jpg';
        const showBranding = options.showBranding !== false;

        const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>${title} | SUDA</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
    <style>
        :root {
            --primary: #1e293b;
            --secondary: #64748b;
            --border: #e2e8f0;
            --bg-muted: #f8fafc;
        }
        
        @page {
            size: A4;
            margin: 20mm;
        }

        body {
            font-family: 'Plus Jakarta Sans', Arial, sans-serif;
            color: var(--primary);
            line-height: 1.6;
            margin: 0;
            padding: 0;
            background: white;
        }

        .container {
            width: 100%;
            max-width: 210mm;
            margin: 0 auto;
            padding: 20px;
            box-sizing: border-box;
        }

        /* Standard Header */
        .print-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 2px solid var(--primary);
            padding-bottom: 15px;
            margin-bottom: 30px;
        }

        .brand-block {
            display: flex;
            align-items: center;
            gap: 15px;
        }

        .logo {
            height: 65px;
            width: auto;
            object-fit: contain;
        }

        .brand-text h1 {
            margin: 0;
            font-size: 1.4rem;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            color: var(--primary);
        }

        .brand-text p {
            margin: 2px 0 0;
            font-size: 0.85rem;
            color: var(--secondary);
            font-weight: 500;
        }

        .report-title-block {
            text-align: right;
        }

        .report-title-block h2 {
            margin: 0;
            font-size: 1.2rem;
            color: var(--primary);
        }

        .report-meta {
            font-size: 0.75rem;
            color: var(--secondary);
            margin-top: 5px;
        }

        /* Table Styling */
        table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
            font-size: 0.9rem;
        }

        th, td {
            border: 1px solid var(--border);
            padding: 10px 12px;
            text-align: left;
        }

        th {
            background-color: var(--bg-muted);
            color: var(--primary);
            font-weight: 600;
            text-transform: uppercase;
            font-size: 0.75rem;
            letter-spacing: 0.05em;
        }

        tr:nth-child(even) {
            background-color: #fafbfc;
        }

        .text-right { text-align: right; }
        .font-bold { font-weight: bold; }

        /* Status Badges in Print */
        .badge {
            padding: 2px 8px;
            border-radius: 4px;
            font-size: 0.75rem;
            font-weight: 600;
            border: 1px solid #ccc;
        }

        /* Footer */
        .print-footer {
            margin-top: 50px;
            padding-top: 15px;
            border-top: 1px solid var(--border);
            text-align: center;
            font-size: 0.75rem;
            color: var(--secondary);
        }

        /* Page Break Logic */
        .page-break {
            page-break-after: always;
        }

        @media print {
            body { padding: 0; }
            .no-print { display: none; }
            .container { padding: 0; width: 100%; }
            tr { page-break-inside: avoid; }
        }

        ${options.styles || ''}
    </style>
</head>
<body>
    <div class="container">
        ${showBranding ? `
        <header class="print-header">
            <div class="brand-block">
                <img src="${logoUrl}" class="logo" alt="SUDA LOGO">
                <div class="brand-text">
                    <h1>Siddipet Urban Development Authority</h1>
                    <p>Government of Telangana | Municipal Admin Department</p>
                </div>
            </div>
            <div class="report-title-block">
                <h2>${title}</h2>
                <div class="report-meta">Generated: ${new Date().toLocaleString('en-IN')}</div>
            </div>
        </header>
        ` : ''}

        <div class="print-content">
            ${contentHtml}
        </div>

        ${showBranding ? `
        <footer class="print-footer">
            <p>This is a computer-generated report from SHOPLEASE Manager. &copy; ${new Date().getFullYear()} SUDA.</p>
        </footer>
        ` : ''}
    </div>

    <script>
        window.onload = function() {
            // Give images and fonts a moment to settle
            setTimeout(() => {
                window.print();
                // Close window after print dialog is closed (user clicks Print or Cancel)
                window.onafterprint = () => window.close();
            }, 600);
        };
    </script>
</body>
</html>`;

        printWindow.document.write(html);
        printWindow.document.close();
    }
};

window.Printer = Printer;
