const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const DB_FILE = path.join(__dirname, 'database.json');

app.use(cors());
app.use(express.json());
// Serve static frontend files from the separated frontend folder - disabled as frontend runs on port 5000
// app.use(express.static(path.join(__dirname, '../frontend')));

// Initial database seeding if file does not exist
function seedDatabase() {
  if (fs.existsSync(DB_FILE)) {
    return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
  }

  const initialData = {
    profile: {
      companyName: "TechCorp Solutions Pvt Ltd",
      accountID: "MC-TECH-9082",
      gstin: "29AAFCT8392F1Z4",
      billingAddress: "Block C, 4th Floor, Tech Park, Outer Ring Road, Bengaluru, Karnataka - 560103",
      contactPerson: "Rajesh Kumar (Accounts Manager)",
      email: "finance@techcorp.com",
      phone: "+91 98765 43210",
      creditLimit: 500000,
      paymentTerms: "Net 30 Days"
    },
    trips: [
      { id: "TRP-1001", date: "2026-05-02", passenger: "Aditi Rao", employeeId: "TC-4402", route: "Indiranagar to Kempegowda Intl Airport", vehicle: "Toyota Innova (KA-03-MM-4122)", driver: "Ramesh Babu", amount: 2200, gst: 110, total: 2310, status: "Invoiced", month: "2026-05" },
      { id: "TRP-1002", date: "2026-05-04", passenger: "Vijay Sharma", employeeId: "TC-1029", route: "Electronic City to Whitefield", vehicle: "Honda City (KA-51-AB-8899)", driver: "Suresh Gowda", amount: 1500, gst: 75, total: 1575, status: "Invoiced", month: "2026-05" },
      { id: "TRP-1003", date: "2026-05-06", passenger: "Sneha Nair", employeeId: "TC-3209", route: "Kempegowda Intl Airport to Koramangala", vehicle: "Maruti Dzire (KA-04-P-5021)", driver: "Anand Sen", amount: 1200, gst: 60, total: 1260, status: "Invoiced", month: "2026-05" },
      { id: "TRP-1004", date: "2026-05-10", passenger: "Rohan Das", employeeId: "TC-2291", route: "Tech Park to Outstation (Mysuru Hub)", vehicle: "Toyota Etios (KA-05-AK-9922)", driver: "Mahesh Naik", amount: 4500, gst: 225, total: 4725, status: "Invoiced", month: "2026-05" },
      { id: "TRP-1005", date: "2026-05-12", passenger: "Amit Verma", employeeId: "TC-0041", route: "Koramangala to Electronic City", vehicle: "Honda City (KA-51-AB-8899)", driver: "Suresh Gowda", amount: 1300, gst: 65, total: 1365, status: "Invoiced", month: "2026-05" },
      { id: "TRP-1006", date: "2026-05-15", passenger: "Priya Mehta", employeeId: "TC-1108", route: "Whitefield to Kempegowda Intl Airport", vehicle: "Toyota Innova (KA-03-MM-4122)", driver: "Ramesh Babu", amount: 2400, gst: 120, total: 2520, status: "Invoiced", month: "2026-05" },
      { id: "TRP-1007", date: "2026-05-18", passenger: "Vijay Sharma", employeeId: "TC-1029", route: "Koramangala to Outer Ring Road", vehicle: "Maruti Dzire (KA-04-P-5021)", driver: "Anand Sen", amount: 800, gst: 40, total: 840, status: "Invoiced", month: "2026-05" },
      { id: "TRP-1008", date: "2026-05-20", passenger: "Rohan Das", employeeId: "TC-2291", route: "Mysuru Hub to Bengaluru City", vehicle: "Toyota Etios (KA-05-AK-9922)", driver: "Mahesh Naik", amount: 4200, gst: 210, total: 4410, status: "Invoiced", month: "2026-05" },
      { id: "TRP-1009", date: "2026-05-22", passenger: "Sneha Nair", employeeId: "TC-3209", route: "Tech Park to Indiranagar", vehicle: "Honda City (KA-51-AB-8899)", driver: "Suresh Gowda", amount: 900, gst: 45, total: 945, status: "Invoiced", month: "2026-05" },
      { id: "TRP-1010", date: "2026-05-25", passenger: "Aditi Rao", employeeId: "TC-4402", route: "Kempegowda Intl Airport to Whitefield", vehicle: "Toyota Innova (KA-03-MM-4122)", driver: "Ramesh Babu", amount: 2300, gst: 115, total: 2415, status: "Invoiced", month: "2026-05" },
      
      // June (Current Unbilled Month)
      { id: "TRP-1011", date: "2026-06-01", passenger: "Nikhil George", employeeId: "TC-7731", route: "Jayanagar to Electronic City", vehicle: "Maruti Dzire (KA-04-P-5021)", driver: "Anand Sen", amount: 950, gst: 47.5, total: 997.5, status: "Unbilled", month: "2026-06" },
      { id: "TRP-1012", date: "2026-06-03", passenger: "Vijay Sharma", employeeId: "TC-1029", route: "Electronic City to Kempegowda Intl Airport", vehicle: "Toyota Innova (KA-03-MM-4122)", driver: "Ramesh Babu", amount: 2400, gst: 120, total: 2520, status: "Unbilled", month: "2026-06" },
      { id: "TRP-1013", date: "2026-06-05", passenger: "Aditi Rao", employeeId: "TC-4402", route: "Tech Park to Whitefield", vehicle: "Honda City (KA-51-AB-8899)", driver: "Suresh Gowda", amount: 1400, gst: 70, total: 1470, status: "Unbilled", month: "2026-06" },
      { id: "TRP-1014", date: "2026-06-08", passenger: "Priya Mehta", employeeId: "TC-1108", route: "Kempegowda Intl Airport to Tech Park", vehicle: "Toyota Etios (KA-05-AK-9922)", driver: "Mahesh Naik", amount: 2100, gst: 105, total: 2205, status: "Unbilled", month: "2026-06" },
      { id: "TRP-1015", date: "2026-06-10", passenger: "Nikhil George", employeeId: "TC-7731", route: "Electronic City to Outer Ring Road", vehicle: "Maruti Dzire (KA-04-P-5021)", driver: "Anand Sen", amount: 900, gst: 45, total: 945, status: "Unbilled", month: "2026-06" }
    ],
    invoices: [
      { invoiceNo: "INV-26-0045", month: "2026-04", issueDate: "2026-05-01", dueDate: "2026-05-31", taxableAmount: 18200, cgst: 455, sgst: 455, igst: 0, totalGst: 910, totalBill: 19110, status: "Paid" },
      { invoiceNo: "INV-26-0092", month: "2026-05", issueDate: "2026-06-01", dueDate: "2026-07-01", taxableAmount: 21000, cgst: 525, sgst: 525, igst: 0, totalGst: 1050, totalBill: 22050, status: "Pending" }
    ],
    queries: [
      { id: "QRY-501", date: "2026-05-15", subject: "Double Billing for Trip TRP-1004", description: "The Mysuru trip was logged with additional wait times which were not approved.", category: "Dispute", status: "Resolved", response: "The waiting charges of ₹300 have been waived off. The invoice reflects the adjusted fare." },
      { id: "QRY-502", date: "2026-06-02", subject: "GSTIN Mismatch in INV-26-0092", description: "Please verify if the IGST/CGST split is correct since our SEZ branch has different exemptions.", category: "GST Issue", status: "Under Review", response: "Our accounting team is checking the tax split for SEZ eligibility. We will update within 24 hours." }
    ]
  };

  fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2), 'utf8');
  return initialData;
}

// Load current data
let db = seedDatabase();

function saveDatabase() {
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf8');
}

// 1. Profile Details
app.get('/api/corporate/profile', (req, res) => {
  res.json(db.profile);
});

// 2. Dashboard Stats
app.get('/api/corporate/dashboard', (req, res) => {
  const currentMonth = "2026-06";
  const activeTrips = db.trips.filter(t => t.month === currentMonth);
  const pendingInvoices = db.invoices.filter(inv => inv.status === "Pending");
  
  const monthlyUsageAmt = activeTrips.reduce((acc, cur) => acc + cur.total, 0);
  const totalOutstanding = pendingInvoices.reduce((acc, cur) => acc + cur.totalBill, 0);
  const totalTripsCount = activeTrips.length;
  const activeInvoicesCount = pendingInvoices.length;

  res.json({
    monthlyUsageAmt,
    totalOutstanding,
    totalTripsCount,
    activeInvoicesCount,
    creditLimit: db.profile.creditLimit,
    creditAvailable: db.profile.creditLimit - totalOutstanding - monthlyUsageAmt
  });
});

// 3. Trip Records
app.get('/api/corporate/trips', (req, res) => {
  const { month, search } = req.query;
  let filtered = [...db.trips];

  if (month) {
    filtered = filtered.filter(t => t.month === month);
  }

  if (search) {
    const q = search.toLowerCase();
    filtered = filtered.filter(t => 
      t.passenger.toLowerCase().includes(q) ||
      t.employeeId.toLowerCase().includes(q) ||
      t.route.toLowerCase().includes(q) ||
      t.id.toLowerCase().includes(q)
    );
  }

  res.json(filtered);
});

// 4. Invoices (GST summaries)
app.get('/api/corporate/invoices', (req, res) => {
  res.json(db.invoices);
});

// 5. Query List & Submission
app.get('/api/corporate/queries', (req, res) => {
  res.json(db.queries);
});

app.post('/api/corporate/queries', (req, res) => {
  const { subject, description, category } = req.body;
  if (!subject || !description || !category) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const newQuery = {
    id: `QRY-${Math.floor(100 + Math.random() * 900)}`,
    date: new Date().toISOString().split('T')[0],
    subject,
    description,
    category,
    status: "Open",
    response: "Awaiting review by the accounts support team."
  };

  db.queries.unshift(newQuery);
  saveDatabase();

  res.status(201).json(newQuery);
});

// 6. Statement Downloads
app.get('/api/corporate/statements/download', (req, res) => {
  const { month } = req.query;
  if (!month) {
    return res.status(400).json({ error: "Month parameter is required (Format: YYYY-MM)" });
  }

  const tripsForMonth = db.trips.filter(t => t.month === month);
  
  if (tripsForMonth.length === 0) {
    return res.status(404).json({ error: "No records found for the selected month" });
  }

  // Create CSV String
  const headers = "Trip ID,Date,Passenger,Employee ID,Route,Vehicle,Driver,Amount (INR),GST 5% (INR),Total (INR),Status\n";
  const rows = tripsForMonth.map(t => 
    `"${t.id}","${t.date}","${t.passenger}","${t.employeeId}","${t.route}","${t.vehicle}","${t.driver}",${t.amount},${t.gst},${t.total},"${t.status}"`
  ).join("\n");

  const csvContent = headers + rows;

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename=statement_${month}_${db.profile.accountID}.csv`);
  res.status(200).send(csvContent);
});

// 7. AI Analysis & Travel Insights
app.get('/api/corporate/ai-insights', (req, res) => {
  const totalTrips = db.trips.length;
  const airportTrips = db.trips.filter(t => t.route.toLowerCase().includes('airport')).length;
  const premiumVehicles = db.trips.filter(t => t.vehicle.toLowerCase().includes('innova') || t.vehicle.toLowerCase().includes('honda')).length;
  
  const totalSpent = db.trips.reduce((acc, c) => acc + c.amount, 0);
  const avgFare = Math.round(totalSpent / totalTrips);
  
  const insights = [
    {
      title: "Airport Route Consolidation Potential",
      description: `Detected ${airportTrips} airport transfers. Dynamic scheduling indicates 3 instances where multiple employees had overlapping flights. Sharing rides could save up to ₹4,200/month.`,
      impact: "Medium Save (₹4,200)",
      category: "Savings"
    },
    {
      title: "Fleet Mix Optimization",
      description: `Premium Sedans & SUVs (Innova/Honda City) account for ${Math.round((premiumVehicles / totalTrips) * 100)}% of travel. Adjusting travel policy to standard Sedans for city transits under 20km could reduce base fares by 15%.`,
      impact: "High Save (₹8,500)",
      category: "Policy Adjust"
    },
    {
      title: "GST Optimization Warning",
      description: `All trips billed currently qualify under local CGST/SGST (5%). No IGST anomalies found. Keep routing billing data matching registered office GSTIN: ${db.profile.gstin} for full ITC claims.`,
      impact: "Compliance Safe",
      category: "Compliance"
    }
  ];

  res.json({
    summary: `Based on your travel profile of ${totalTrips} total trips. Average fare is ₹${avgFare}. We identified 3 travel cost optimization hubs.`,
    insights
  });
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

module.exports = app;
