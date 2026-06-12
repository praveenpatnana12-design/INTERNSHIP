document.addEventListener('DOMContentLoaded', () => {
  const BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? 'http://localhost:3000' : '';
  
  // ==========================================
  // 1. DATA ARRAYS (Populated from backend APIs)
  // ==========================================

  let mockProfile = {};
  let mockTrips = [];
  let mockInvoices = [];
  let mockStatements = [
    { name: "Statement_Q1_FY26.pdf", period: "Q1 FY26 (Apr - Jun 2026)", size: "2.4 MB", date: "2026-06-10" },
    { name: "Statement_May_2026.csv", period: "May 2026", size: "840 KB", date: "2026-06-01" },
    { name: "Statement_April_2026.csv", period: "April 2026", size: "720 KB", date: "2026-05-01" }
  ];
  let mockTickets = [];
  let mockOptimizations = [];

  function formatPeriod(monthStr) {
    if (!monthStr || !monthStr.includes('-')) return monthStr;
    const [year, month] = monthStr.split('-');
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    return `${months[parseInt(month, 10) - 1]} ${year}`;
  }

  // --- API FETCH FUNCTIONS ---

  async function resolveProfileDetails() {
    try {
      const res = await fetch(`${BASE_URL}/api/corporate/profile`);
      const data = await res.json();
      mockProfile = {
        companyName: data.companyName,
        accountID: data.accountID,
        gstin: data.gstin,
        billingHub: data.billingAddress ? data.billingAddress.split(',').slice(-2, -1)[0].trim() : "Bengaluru",
        liaison: data.contactPerson,
        email: data.email,
        paymentTerms: data.paymentTerms
      };

      document.getElementById('profile-company-name').textContent = mockProfile.companyName;
      document.getElementById('profile-account-id').textContent = `ID: ${mockProfile.accountID}`;
      document.getElementById('profile-payment-terms').textContent = mockProfile.paymentTerms;

      document.getElementById('prof-gstin').textContent = mockProfile.gstin;
      document.getElementById('prof-address').textContent = mockProfile.billingHub;
      document.getElementById('prof-contact').textContent = mockProfile.liaison;
      document.getElementById('prof-email').textContent = mockProfile.email;
    } catch (err) {
      console.error("Error fetching profile details:", err);
    }
  }

  async function resolveDashboardStats() {
    try {
      const res = await fetch(`${BASE_URL}/api/corporate/dashboard`);
      const stats = await res.json();
      document.getElementById('stat-monthly-usage').textContent = `₹${stats.monthlyUsageAmt.toLocaleString('en-IN')}`;
      document.getElementById('stat-outstanding').textContent = `₹${stats.totalOutstanding.toLocaleString('en-IN')}`;
      document.getElementById('stat-trips-count').textContent = stats.totalTripsCount;
      document.getElementById('stat-credit-available').textContent = `₹${stats.creditAvailable.toLocaleString('en-IN')}`;
      document.getElementById('stat-credit-limit').textContent = `₹${stats.creditLimit.toLocaleString('en-IN')}`;
      
      const usagePercent = Math.min(100, Math.max(0, (stats.monthlyUsageAmt / stats.creditLimit) * 100));
      const outstandingPercent = Math.min(100, Math.max(0, (stats.totalOutstanding / stats.creditLimit) * 100));
      
      document.getElementById('usage-progress').style.width = `${usagePercent}%`;
      document.getElementById('outstanding-progress').style.width = `${outstandingPercent}%`;
    } catch (err) {
      console.error("Error fetching dashboard stats:", err);
    }
  }

  async function fetchTrips() {
    try {
      const res = await fetch(`${BASE_URL}/api/corporate/trips`);
      const rawTrips = await res.json();
      mockTrips = rawTrips.map(trip => {
        const sourceDest = trip.route ? trip.route.split(' to ') : ['', ''];
        return {
          id: trip.id,
          employee: trip.passenger,
          date: trip.date,
          source: sourceDest[0] || '',
          destination: sourceDest[1] || '',
          vehicle: trip.vehicle,
          status: trip.status === 'Invoiced' ? 'Completed' : 'Ongoing',
          cost: trip.total
        };
      });
    } catch (err) {
      console.error("Error fetching trips:", err);
    }
  }

  async function fetchInvoices() {
    try {
      const res = await fetch(`${BASE_URL}/api/corporate/invoices`);
      const rawInvoices = await res.json();
      mockInvoices = rawInvoices.map(inv => ({
        number: inv.invoiceNo,
        period: formatPeriod(inv.month),
        base: inv.taxableAmount,
        cgst: inv.cgst,
        sgst: inv.sgst,
        total: inv.totalBill,
        status: inv.status
      }));
    } catch (err) {
      console.error("Error fetching invoices:", err);
    }
  }

  async function fetchQueries() {
    try {
      const res = await fetch(`${BASE_URL}/api/corporate/queries`);
      const data = await res.json();
      mockTickets = data.map(query => {
        const messages = [];
        if (query.description) {
          messages.push({
            sender: "User",
            text: query.description,
            time: query.date || "Just now"
          });
        }
        if (query.response) {
          messages.push({
            sender: "Support",
            text: query.response,
            time: query.date || "Just now"
          });
        }
        return {
          id: query.id,
          subject: query.subject,
          status: query.status === 'Resolved' ? 'Closed' : 'Open',
          messages: messages
        };
      });
    } catch (err) {
      console.error("Error fetching queries:", err);
    }
  }

  async function fetchAIInsights() {
    try {
      const res = await fetch(`${BASE_URL}/api/corporate/ai-insights`);
      const data = await res.json();
      mockOptimizations = data.insights.map((insight, idx) => {
        const savingsMatch = insight.impact.match(/₹([\d,]+)/);
        const savings = savingsMatch ? parseInt(savingsMatch[1].replace(/,/g, ''), 10) : 0;
        return {
          id: `OPT-0${idx + 1}`,
          title: insight.title,
          desc: insight.description,
          savings: savings,
          status: "Pending Optimization"
        };
      });
    } catch (err) {
      console.error("Error fetching AI insights:", err);
    }
  }

  // ==========================================
  // 2. ROUTING & TAB NAVIGATION
  // ==========================================

  const navItems = document.querySelectorAll('.nav-item');
  const tabPanes = document.querySelectorAll('.tab-pane');
  const activeTabTitle = document.getElementById('active-tab-title');
  const activeTabDesc = document.getElementById('active-tab-desc');

  const tabMetadata = {
    'tab-dashboard': { title: 'Dashboard Overview', desc: 'Real-time usage statistics and B2B account billing status.' },
    'tab-trips': { title: 'Trip Usage Logs', desc: 'Search and filter active corporate employee travel logs.' },
    'tab-workflow': { title: 'Booking Lifecycle Tracker', desc: 'Interactive simulation tracking employee requests from creation to closure.' },
    'tab-invoices': { title: 'GST Invoices Ledger', desc: 'Legally compliant B2B tax statements and invoice listings.' },
    'tab-statements': { title: 'Statements Portal', desc: 'Generate and review quarter/monthly travel account statements.' },
    'tab-queries': { title: 'Accounts Queries Support', desc: 'File billing disputes and text directly with accounting liaisons.' },
    'tab-insights': { title: 'AI Optimization Insights', desc: 'Smart algorithms highlighting potential vehicle and route savings.' }
  };

  navItems.forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const targetTab = item.getAttribute('data-tab');

      // Toggle active navigation links
      navItems.forEach(nav => nav.classList.remove('active'));
      item.classList.add('active');

      // Toggle visible tab panel
      tabPanes.forEach(pane => pane.classList.remove('active'));
      document.getElementById(targetTab).classList.add('active');

      // Update Header Text
      if (tabMetadata[targetTab]) {
        activeTabTitle.textContent = tabMetadata[targetTab].title;
        activeTabDesc.textContent = tabMetadata[targetTab].desc;
      }

      // Initialize specific page logics
      triggerPageInitialization(targetTab);
    });
  });

  function triggerPageInitialization(tabId) {
    if (tabId === 'tab-trips') renderTripsTable();
    if (tabId === 'tab-workflow') initWorkflowSimulator();
    if (tabId === 'tab-invoices') renderInvoicesTable();
    if (tabId === 'tab-statements') renderStatementsHistory();
    if (tabId === 'tab-queries') renderQueriesPanel();
    if (tabId === 'tab-insights') renderAIInsights();
  }

  // ==========================================
  // 3. PAGE LOGICS & RENDERING
  // ==========================================

  // --- TRIP USAGE LOGS ---
  const tripSearchInput = document.getElementById('trip-search-input');
  const tripStatusSelect = document.getElementById('trip-status-select');

  function renderTripsTable() {
    const tbody = document.getElementById('trips-table-body');
    tbody.innerHTML = '';

    const filterText = tripSearchInput.value.toLowerCase();
    const filterStatus = tripStatusSelect.value;

    const filteredTrips = mockTrips.filter(t => {
      const matchesSearch = t.employee.toLowerCase().includes(filterText) ||
                            t.vehicle.toLowerCase().includes(filterText) ||
                            t.id.toLowerCase().includes(filterText);
      const matchesStatus = (filterStatus === 'All') || (t.status === filterStatus);
      return matchesSearch && matchesStatus;
    });

    if (filteredTrips.length === 0) {
      tbody.innerHTML = `<tr><td colspan="8" style="text-align: center; color: var(--text-muted);">No trips match your filters.</td></tr>`;
      return;
    }

    filteredTrips.forEach(t => {
      const row = document.createElement('tr');
      const statusBadge = `<span class="status-badge ${t.status.toLowerCase()}">${t.status}</span>`;
      const costDisplay = t.cost > 0 ? `₹${t.cost.toLocaleString('en-IN')}` : '—';
      
      row.innerHTML = `
        <td><strong>${t.id}</strong></td>
        <td>${t.employee}</td>
        <td>${t.date}</td>
        <td>${t.source}</td>
        <td>${t.destination}</td>
        <td>${t.vehicle}</td>
        <td>${statusBadge}</td>
        <td><strong style="color: var(--primary-glow);">${costDisplay}</strong></td>
      `;
      tbody.appendChild(row);
    });
  }

  tripSearchInput.addEventListener('input', renderTripsTable);
  tripStatusSelect.addEventListener('change', renderTripsTable);

  // Download CSV mock button click
  document.getElementById('btn-download-trips-csv').addEventListener('click', () => {
    let csvContent = "data:text/csv;charset=utf-8,Trip ID,Employee Name,Date,Source,Destination,Vehicle Type,Status,Cost\n";
    mockTrips.forEach(t => {
      csvContent += `"${t.id}","${t.employee}","${t.date}","${t.source}","${t.destination}","${t.vehicle}","${t.status}",${t.cost}\n`;
    });
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "Manivtha_Trip_Usage_Logs.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  });


  // --- GST INVOICES ---
  function renderInvoicesTable() {
    const tbody = document.getElementById('invoices-table-body');
    tbody.innerHTML = '';

    mockInvoices.forEach(inv => {
      const row = document.createElement('tr');
      const statusClass = inv.status.toLowerCase();

      row.innerHTML = `
        <td><strong>${inv.number}</strong></td>
        <td>${inv.period}</td>
        <td>₹${inv.base.toLocaleString('en-IN')}</td>
        <td>₹${inv.cgst.toLocaleString('en-IN')}</td>
        <td>₹${inv.sgst.toLocaleString('en-IN')}</td>
        <td><strong style="color: var(--primary-glow);">₹${inv.total.toLocaleString('en-IN')}</strong></td>
        <td><span class="status-badge ${statusClass}">${inv.status}</span></td>
        <td>
          <button class="btn-action view-pdf-btn" data-invoice="${inv.number}"><i class="fa-solid fa-file-pdf"></i> PDF</button>
          <button class="btn-action download-invoice-btn" data-invoice="${inv.number}"><i class="fa-solid fa-download"></i></button>
        </td>
      `;
      tbody.appendChild(row);
    });

    // Wire up buttons
    document.querySelectorAll('.view-pdf-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const invNo = btn.getAttribute('data-invoice');
        const inv = mockInvoices.find(i => i.number === invNo);
        if (!inv) return;
        
        const printWindow = window.open('', '_blank');
        if (printWindow) {
          printWindow.document.write(`
            <html>
            <head>
              <title>Tax Invoice - ${inv.number}</title>
              <style>
                body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #333; padding: 40px; line-height: 1.6; }
                .invoice-header { display: flex; justify-content: space-between; border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 30px; }
                .invoice-header h1 { margin: 0; font-size: 24px; color: #111; }
                .company-details { text-align: right; font-size: 13px; color: #666; }
                .bill-to { margin-bottom: 40px; }
                .bill-to h3 { margin: 0 0 10px 0; font-size: 14px; text-transform: uppercase; color: #888; }
                .bill-to p { margin: 2px 0; font-size: 14px; }
                .invoice-details { margin-bottom: 30px; font-size: 14px; }
                .invoice-details table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                .invoice-details th, .invoice-details td { padding: 12px; border-bottom: 1px solid #ddd; text-align: left; }
                .invoice-details th { background: #f9f9f9; font-weight: bold; }
                .invoice-details td.amount { text-align: right; }
                .invoice-details th.amount { text-align: right; }
                .invoice-total { margin-top: 20px; text-align: right; }
                .invoice-total table { width: 300px; margin-left: auto; border-collapse: collapse; }
                .invoice-total td { padding: 8px 12px; text-align: right; font-size: 14px; }
                .invoice-total td.grand-total { font-size: 18px; font-weight: bold; border-top: 2px solid #333; padding-top: 12px; }
                .footer { margin-top: 60px; text-align: center; font-size: 12px; color: #999; border-top: 1px solid #eee; padding-top: 20px; }
                @media print {
                  body { padding: 0; }
                  .btn-print { display: none; }
                }
              </style>
            </head>
            <body>
              <div style="text-align: right; margin-bottom: 20px;">
                <button class="btn-print" onclick="window.print()" style="padding: 10px 20px; background: #8b5cf6; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: bold;">Print Invoice</button>
              </div>
              <div class="invoice-header">
                <div>
                  <h1>Manivtha Tours & Travels</h1>
                  <p style="margin: 4px 0 0 0; font-size: 14px; color: #555;">B2B Corporate Travel Solutions</p>
                </div>
                <div class="company-details">
                  <strong>Manivtha Tours & Travels</strong><br>
                  H.No 1-90/A, Hitech City, Madhapur,<br>
                  Hyderabad, Telangana - 500081<br>
                  GSTIN: 36AAAAA1111A1Z1
                </div>
              </div>

              <div style="display: flex; justify-content: space-between; margin-bottom: 30px;">
                <div class="bill-to">
                  <h3>Billed To:</h3>
                  <strong>${mockProfile.companyName}</strong><br>
                  Billing Hub: ${mockProfile.billingHub}<br>
                  Liaison: ${mockProfile.liaison}<br>
                  Email: ${mockProfile.email}
                </div>
                <div style="text-align: right; font-size: 14px;">
                  <strong>Invoice No:</strong> ${inv.number}<br>
                  <strong>Billing Cycle:</strong> ${inv.period}<br>
                  <strong>Date:</strong> ${new Date().toISOString().split('T')[0]}<br>
                  <strong>Payment Status:</strong> <span style="font-weight: bold; color: ${inv.status === 'Paid' ? '#10b981' : '#f59e0b'}">${inv.status}</span>
                </div>
              </div>

              <div class="invoice-details">
                <table>
                  <thead>
                    <tr>
                      <th>Description</th>
                      <th class="amount">Taxable Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>Consolidated Corporate Cab Booking Usage - ${inv.period}</td>
                      <td class="amount">₹${inv.base.toLocaleString('en-IN')}.00</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div class="invoice-total">
                <table>
                  <tr>
                    <td>Taxable Amount:</td>
                    <td>₹${inv.base.toLocaleString('en-IN')}.00</td>
                  </tr>
                  <tr>
                    <td>CGST (9%):</td>
                    <td>₹${inv.cgst.toLocaleString('en-IN')}.00</td>
                  </tr>
                  <tr>
                    <td>SGST (9%):</td>
                    <td>₹${inv.sgst.toLocaleString('en-IN')}.00</td>
                  </tr>
                  <tr>
                    <td class="grand-total">Total Bill:</td>
                    <td class="grand-total">₹${inv.total.toLocaleString('en-IN')}.00</td>
                  </tr>
                </table>
              </div>

              <div class="footer">
                <p>This is a computer-generated invoice and does not require a physical signature.</p>
                <p>Thank you for choosing Manivtha Tours & Travels!</p>
              </div>
            </body>
            </html>
          `);
          printWindow.document.close();
        }
      });
    });

    document.querySelectorAll('.download-invoice-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const invNo = btn.getAttribute('data-invoice');
        const inv = mockInvoices.find(i => i.number === invNo);
        if (!inv) return;

        const textContent = `==================================================
        MANIVTHA TOURS & TRAVELS - TAX INVOICE
==================================================
Invoice Number : ${inv.number}
Billing Cycle  : ${inv.period}
Date Issued    : ${new Date().toISOString().split('T')[0]}
Client Name    : ${mockProfile.companyName}
Client GSTIN   : ${mockProfile.gstin}

--------------------------------------------------
Taxable Base Amount : INR ${inv.base.toLocaleString('en-IN')}.00
CGST (9%)           : INR ${inv.cgst.toLocaleString('en-IN')}.00
SGST (9%)           : INR ${inv.sgst.toLocaleString('en-IN')}.00
--------------------------------------------------
Total Invoice Bill  : INR ${inv.total.toLocaleString('en-IN')}.00
Payment Status      : ${inv.status}
==================================================
Thank you for traveling with Manivtha Tours!
`;

        const element = document.createElement('a');
        const file = new Blob([textContent], {type: 'text/plain'});
        element.href = URL.createObjectURL(file);
        element.download = `Invoice_${inv.number}.txt`;
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
      });
    });
  }

  // --- STATEMENTS PORTAL ---
  const statementsContainer = document.getElementById('statements-download-container');
  const periodSelect = document.getElementById('statement-period-select');
  const generateBtn = document.getElementById('generate-statement-btn');

  function renderStatementsHistory() {
    statementsContainer.innerHTML = '';
    mockStatements.forEach((s, idx) => {
      const item = document.createElement('div');
      item.className = 'download-history-item';
      item.innerHTML = `
        <div class="history-item-left">
          <i class="fa-solid ${s.name.endsWith('.pdf') ? 'fa-file-pdf' : 'fa-file-excel'}"></i>
          <div class="history-info">
            <strong>${s.name}</strong>
            <span>Cycle: ${s.period} | Created: ${s.date} (${s.size})</span>
          </div>
        </div>
        <div class="history-item-right">
          <i class="fa-solid fa-arrow-down-long"></i>
        </div>
      `;
      
      item.addEventListener('click', () => {
        alert(`Downloading archived statement file: ${s.name}`);
      });

      statementsContainer.appendChild(item);
    });
  }

  generateBtn.addEventListener('click', async () => {
    const cycle = periodSelect.value;
    
    // Map cycle to month YYYY-MM
    let month = '';
    if (cycle === 'May 2026') month = '2026-05';
    else if (cycle === 'April 2026') month = '2026-04';
    else if (cycle === 'Q1 FY26') month = '2026-05'; // fallback
    else if (cycle === 'Q4 FY25') month = '2026-04'; // fallback
    else month = '2026-06';
    
    const downloadUrl = `${BASE_URL}/api/corporate/statements/download?month=${month}`;
    
    try {
      const res = await fetch(downloadUrl);
      if (!res.ok) {
        const err = await res.json();
        alert(`Error generating statement: ${err.error}`);
        return;
      }
      
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `statement_${month}_${mockProfile.accountID}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      // Update download list history
      const newFileName = `statement_${month}_${mockProfile.accountID}.csv`;
      const newStatement = {
        name: newFileName,
        period: cycle,
        size: `${(blob.size / 1024).toFixed(1)} KB`,
        date: new Date().toISOString().split('T')[0]
      };
      
      mockStatements.unshift(newStatement);
      renderStatementsHistory();
      alert(`Success! Generated account statement: ${newFileName} and downloaded to your device.`);
    } catch (err) {
      console.error("Error generating statement:", err);
      alert("Error generating statement. Please ensure the backend server is running.");
    }
  });


  // --- ACCOUNTS QUERIES (Split panel Chat UI) ---
  const ticketListContainer = document.getElementById('ticket-list-container');
  const chatMessagesContainer = document.getElementById('chat-messages-container');
  const chatTicketSubject = document.getElementById('chat-ticket-subject');
  const chatTicketMeta = document.getElementById('chat-ticket-meta');
  const chatReplyInput = document.getElementById('chat-reply-input');
  const chatReplySendBtn = document.getElementById('chat-reply-send-btn');
  
  let activeTicketId = null;

  function renderQueriesPanel() {
    ticketListContainer.innerHTML = '';
    
    mockTickets.forEach(ticket => {
      const item = document.createElement('div');
      item.className = `ticket-sidebar-item ${ticket.id === activeTicketId ? 'active' : ''}`;
      
      const badgeClass = ticket.status.toLowerCase();
      item.innerHTML = `
        <div class="ticket-item-header">
          <strong>${ticket.id}</strong>
          <span class="status-badge ${badgeClass}">${ticket.status}</span>
        </div>
        <h4>${ticket.subject}</h4>
        <p>Messages: ${ticket.messages.length}</p>
      `;

      item.addEventListener('click', () => {
        activeTicketId = ticket.id;
        renderQueriesPanel();
        loadTicketThread(ticket);
      });

      ticketListContainer.appendChild(item);
    });
  }

  function loadTicketThread(ticket) {
    chatTicketSubject.textContent = ticket.subject;
    chatTicketMeta.innerHTML = `Status: <span class="status-badge ${ticket.status.toLowerCase()}">${ticket.status}</span> | ID: <strong>${ticket.id}</strong>`;
    
    chatReplyInput.removeAttribute('disabled');
    chatReplySendBtn.removeAttribute('disabled');

    chatMessagesContainer.innerHTML = '';
    ticket.messages.forEach(msg => {
      const bubble = document.createElement('div');
      bubble.className = `chat-message ${msg.sender === 'User' ? 'sent' : 'received'}`;
      bubble.innerHTML = `
        <p>${msg.text}</p>
        <span class="message-meta">${msg.time}</span>
      `;
      chatMessagesContainer.appendChild(bubble);
    });

    // Scroll chat area to bottom
    chatMessagesContainer.scrollTop = chatMessagesContainer.scrollHeight;
  }

  function sendChatReply() {
    const text = chatReplyInput.value.trim();
    if (!text || !activeTicketId) return;

    const ticket = mockTickets.find(t => t.id === activeTicketId);
    if (!ticket) return;

    // Append user message
    ticket.messages.push({
      sender: "User",
      text: text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    });

    chatReplyInput.value = '';
    loadTicketThread(ticket);
    renderQueriesPanel();

    // Trigger auto support reply simulation after 1.5 seconds
    if (ticket.status !== 'Closed') {
      setTimeout(() => {
        ticket.messages.push({
          sender: "Support",
          text: "Thanks for the details. Our accounts team has received this reply. We will review and contact you shortly.",
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        });
        if (activeTicketId === ticket.id) {
          loadTicketThread(ticket);
          renderQueriesPanel();
        }
      }, 1500);
    }
  }

  chatReplySendBtn.addEventListener('click', sendChatReply);
  chatReplyInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') sendChatReply();
  });


  // --- AI OPTIMIZATION PANEL ---
  function renderAIInsights() {
    // 1. Calculate dashboard card stats
    const pendingCount = mockOptimizations.filter(o => o.status !== 'Optimized').length;
    const totalSavings = mockOptimizations.reduce((acc, curr) => {
      return acc + (curr.status === 'Optimized' ? 0 : curr.savings);
    }, 0);
    
    document.getElementById('ai-stat-routes').textContent = `${pendingCount} Routes Available`;
    document.getElementById('ai-stat-savings').textContent = `₹${totalSavings.toLocaleString('en-IN')}.00 / mo`;
    document.getElementById('ai-stat-idle').textContent = pendingCount > 0 ? "2 Vehicles Idle" : "0 Vehicles Idle";

    // 2. Populate recommendations list table
    const tbody = document.getElementById('optimizations-list-body');
    tbody.innerHTML = '';

    mockOptimizations.forEach(opt => {
      const row = document.createElement('tr');
      const isOptimized = opt.status === 'Optimized';
      const statusBadge = `<span class="status-badge ${isOptimized ? 'completed' : 'ongoing'}">${opt.status}</span>`;
      
      let actionBtn = '';
      if (!isOptimized) {
        actionBtn = `<button class="btn btn-primary btn-opt-apply" data-id="${opt.id}" style="padding: 6px 12px; font-size: 11px;">Apply Optimization</button>`;
      } else {
        actionBtn = `<button class="btn btn-secondary-small" style="padding: 6px 12px; font-size: 11px; opacity: 0.6;" disabled><i class="fa-solid fa-circle-check"></i> Applied</button>`;
      }

      row.innerHTML = `
        <td><strong>${opt.title}</strong></td>
        <td>${opt.desc}</td>
        <td><strong style="color: var(--success);">₹${opt.savings.toLocaleString('en-IN')}</strong></td>
        <td>${statusBadge}</td>
        <td>${actionBtn}</td>
      `;
      tbody.appendChild(row);
    });

    // Attach click events
    document.querySelectorAll('.btn-opt-apply').forEach(btn => {
      btn.addEventListener('click', () => {
        const optId = btn.getAttribute('data-id');
        const target = mockOptimizations.find(o => o.id === optId);
        if (target) {
          target.status = 'Optimized';
          renderAIInsights();
          alert(`Successfully applied optimization plan: "${target.title}". Core route settings updated and monthly projections corrected!`);
        }
      });
    });
  }

  // --- BOOKING LIFECYCLE SIMULATOR ---
  let activeSimStep = 0;
  
  const stepMessages = {
    1: (name, route) => `[Step 1] Employee Request: Passenger ${name} requested a new trip for ${route}.`,
    2: (name, route) => `[Step 2] Corporate Approval: Travel request authorized by TechCorp Accounts division. Limit checked.`,
    3: (name, route) => `[Step 3] Vendor Receives Request: Dispatch desk registered travel ticket under reference #MN-${Math.floor(10000+Math.random()*90000)}.`,
    4: (name, route) => `[Step 4] Vehicle & Driver Allocation: Toyota Innova (KA-03-MM-4122) and Ramesh Babu assigned.`,
    5: (name, route) => `[Step 5] Booking Confirmation: Confirmation alerts dispatched to passenger ${name} and coordinator.`,
    6: (name, route) => `[Step 6] Trip Execution: Chauffeur reported at pickup. Trip started. Real-time GPS enabled.`,
    7: (name, route) => `[Step 7] Trip Completion: Passenger dropped safely. Final duty slip registered (distance validated).`,
    8: (name, route) => `[Step 8] Invoice Generation: CGST (9%) and SGST (9%) calculated. Tax Invoice INV-26-0945 generated.`,
    9: (name, route) => `[Step 9] Monthly Billing Statement: Invoice aggregated into consolidated statement for June cycle billing.`,
    10: (name, route) => `[Step 10] Payment Collection: TechCorp corporate finance processes NEFT clearing payment.`,
    11: (name, route) => `[Step 11] Booking Closed: Account balance settled. Database record archived and closed.`
  };

  const stepLabels = {
    0: "Not Started",
    1: "Employee Request",
    2: "Corporate Approval",
    3: "Vendor Received",
    4: "Resource Allocated",
    5: "Reservation Confirmed",
    6: "Trip In Transit",
    7: "Trip Completed",
    8: "Invoice Dispatched",
    9: "Statement Consolidated",
    10: "Payment In Process",
    11: "Booking Closed & Settled"
  };

  function initWorkflowSimulator() {
    const btnStart = document.getElementById('btn-start-simulation');
    const btnNext = document.getElementById('btn-next-step');
    const btnReset = document.getElementById('btn-reset-simulation');
    const logsContainer = document.getElementById('sim-console-logs');
    const activeLabel = document.getElementById('sim-active-stage-label');
    const progressFill = document.getElementById('stepper-progress-fill');
    const stepNodes = document.querySelectorAll('.step-node-item');
    const empInput = document.getElementById('simulation-employee');
    const routeInput = document.getElementById('simulation-route');

    function updateStepperUI() {
      // Stepper node statuses
      stepNodes.forEach(node => {
        const stepNum = parseInt(node.getAttribute('data-step'), 10);
        node.classList.remove('active', 'completed');
        
        if (stepNum === activeSimStep) {
          node.classList.add('active');
        } else if (stepNum < activeSimStep) {
          node.classList.add('completed');
        }
      });

      // Stepper height calculation
      if (activeSimStep === 0) {
        progressFill.style.height = '0%';
      } else if (activeSimStep === 11) {
        progressFill.style.height = '100%';
      } else {
        const heightPct = ((activeSimStep - 1) / 10) * 100;
        progressFill.style.height = `${heightPct}%`;
      }

      // Labels
      activeLabel.textContent = stepLabels[activeSimStep];
    }

    function addConsoleLog(message) {
      const logItem = document.createElement('div');
      logItem.textContent = message;
      logsContainer.appendChild(logItem);
      logsContainer.scrollTop = logsContainer.scrollHeight;
    }

    // Remove existing event listeners to avoid duplicates on tab toggle
    const newBtnStart = btnStart.cloneNode(true);
    btnStart.parentNode.replaceChild(newBtnStart, btnStart);
    
    const newBtnNext = btnNext.cloneNode(true);
    btnNext.parentNode.replaceChild(newBtnNext, btnNext);
    
    const newBtnReset = btnReset.cloneNode(true);
    btnReset.parentNode.replaceChild(newBtnReset, btnReset);

    newBtnStart.addEventListener('click', () => {
      const passenger = empInput.value.trim() || "Vijay Sharma";
      const route = routeInput.value.trim() || "Madhapur to Airport";
      
      activeSimStep = 1;
      logsContainer.innerHTML = '';
      addConsoleLog(`[System Started] Initiating lifecycle track for passenger: ${passenger}`);
      addConsoleLog(stepMessages[1](passenger, route));
      
      newBtnStart.setAttribute('disabled', 'true');
      newBtnNext.removeAttribute('disabled');
      empInput.setAttribute('disabled', 'true');
      routeInput.setAttribute('disabled', 'true');
      
      updateStepperUI();
    });

    newBtnNext.addEventListener('click', () => {
      const passenger = empInput.value.trim() || "Vijay Sharma";
      const route = routeInput.value.trim() || "Madhapur to Airport";
      
      if (activeSimStep < 11) {
        activeSimStep++;
        addConsoleLog(stepMessages[activeSimStep](passenger, route));
        
        if (activeSimStep === 11) {
          newBtnNext.setAttribute('disabled', 'true');
          addConsoleLog(`[Success] Booking Simulation completed. All systems report zero anomalies.`);
        }
        
        updateStepperUI();
      }
    });

    newBtnReset.addEventListener('click', () => {
      activeSimStep = 0;
      logsContainer.innerHTML = '<div>[System Idle] Press Start Simulation to begin...</div>';
      
      newBtnStart.removeAttribute('disabled');
      newBtnNext.setAttribute('disabled', 'true');
      empInput.removeAttribute('disabled');
      routeInput.removeAttribute('disabled');
      
      updateStepperUI();
    });

    updateStepperUI();
  }

  // ==========================================
  // 4. LIGHT/DARK THEME TOGGLE
  // ==========================================

  const themeToggleBtn = document.getElementById('theme-toggle-btn');
  themeToggleBtn.addEventListener('click', () => {
    document.body.classList.toggle('light-theme');
    
    const icon = themeToggleBtn.querySelector('i');
    if (document.body.classList.contains('light-theme')) {
      icon.className = 'fa-solid fa-sun';
    } else {
      icon.className = 'fa-solid fa-moon';
    }
  });

  // Initial load checks
  async function initApp() {
    await resolveProfileDetails();
    await resolveDashboardStats();
    await fetchTrips();
    await fetchInvoices();
    await fetchQueries();
    await fetchAIInsights();
    
    triggerPageInitialization('tab-dashboard');
  }
  initApp();
});
