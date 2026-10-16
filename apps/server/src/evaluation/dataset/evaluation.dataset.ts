import {
  EVALUATION_CATEGORIES,
  EVALUATION_FINANCIAL_MEANINGS,
  EVALUATION_SPENDING_TIERS,
  EvaluationFixture,
} from "../types/evaluation.types";

/**
 * Benchmark labelled evaluation dataset for FinOne transaction classification.
 *
 * Synthetic, realistic transaction narrations representing Indian banking, UPI,
 * cards, netbanking, utility bills, salary credits, balance rows, and edge cases.
 * Strictly contains NO personal, identifiable, or real banking credentials.
 */
export const EVALUATION_DATASET: EvaluationFixture[] = [
  // =========================================================================
  // 1. FOOD & DINING (Essential Groceries vs Discretionary Dining & Delivery)
  // =========================================================================
  {
    id: "FOOD-001",
    description: "UPI/SWIGGY/ORDER_982341/BANGALORE",
    amount: 450.0,
    direction: "DEBIT",
    date: "2026-10-01",
    expected: {
      financialMeaning: "EXPENSE",
      isEligibleExpense: true,
      category: "FOOD",
      spendingTier: "GOOD_TO_HAVE",
      tags: ["food", "delivery", "dinner"],
    },
  },
  {
    id: "FOOD-002",
    description: "UPI-ZOMATO-PAY-5678-RESTAURANT",
    amount: 1250.0,
    direction: "DEBIT",
    date: "2026-10-02",
    expected: {
      financialMeaning: "EXPENSE",
      isEligibleExpense: true,
      category: "FOOD",
      spendingTier: "GOOD_TO_HAVE",
      tags: ["food", "dining", "weekend"],
    },
  },
  {
    id: "FOOD-003",
    description: "POS 482194 DMART SUPERMARKET MUMBAI",
    amount: 3420.5,
    direction: "DEBIT",
    date: "2026-10-03",
    expected: {
      financialMeaning: "EXPENSE",
      isEligibleExpense: true,
      category: "FOOD",
      spendingTier: "ESSENTIAL",
      tags: ["groceries", "supermarket", "household"],
    },
  },
  {
    id: "FOOD-004",
    description: "UPI/BLINKIT/INSTANT_GROCERY/GURGAON",
    amount: 620.0,
    direction: "DEBIT",
    date: "2026-10-04",
    expected: {
      financialMeaning: "EXPENSE",
      isEligibleExpense: true,
      category: "FOOD",
      spendingTier: "ESSENTIAL",
      tags: ["groceries", "quick-commerce"],
    },
  },
  {
    id: "FOOD-005",
    description: "ZEPTO QUICK GROCERY DELHI",
    amount: 410.0,
    direction: "DEBIT",
    date: "2026-10-04",
    expected: {
      financialMeaning: "EXPENSE",
      isEligibleExpense: true,
      category: "FOOD",
      spendingTier: "ESSENTIAL",
      tags: ["groceries", "quick-commerce"],
    },
  },
  {
    id: "FOOD-006",
    description: "STARBUCKS COFFEE KORAMANGALA",
    amount: 780.0,
    direction: "DEBIT",
    date: "2026-10-05",
    expected: {
      financialMeaning: "EXPENSE",
      isEligibleExpense: true,
      category: "FOOD",
      spendingTier: "LUXURY",
      tags: ["coffee", "cafe", "discretionary"],
    },
  },
  {
    id: "FOOD-007",
    description: "NATURES BASKET GOURMET FOOD STORE",
    amount: 5400.0,
    direction: "DEBIT",
    date: "2026-10-06",
    expected: {
      financialMeaning: "EXPENSE",
      isEligibleExpense: true,
      category: "FOOD",
      spendingTier: "LUXURY",
      tags: ["groceries", "gourmet", "luxury"],
    },
  },
  {
    id: "FOOD-008",
    description: "UPI/LOCAL CHAI CORNER/9876543210",
    amount: 40.0,
    direction: "DEBIT",
    date: "2026-10-06",
    expected: {
      financialMeaning: "EXPENSE",
      isEligibleExpense: true,
      category: "FOOD",
      spendingTier: "GOOD_TO_HAVE",
      tags: ["tea", "snacks"],
    },
  },

  // =========================================================================
  // 2. FUEL & COMMUTE REFUELING
  // =========================================================================
  {
    id: "FUEL-001",
    description: "POS 456728 SHELL PETROL PUMP WHITEFIELD",
    amount: 2500.0,
    direction: "DEBIT",
    date: "2026-10-02",
    expected: {
      financialMeaning: "EXPENSE",
      isEligibleExpense: true,
      category: "FUEL",
      spendingTier: "ESSENTIAL",
      tags: ["fuel", "petrol", "vehicle"],
    },
  },
  {
    id: "FUEL-002",
    description: "HPCL AUTO FUEL STATION PUNE",
    amount: 1800.0,
    direction: "DEBIT",
    date: "2026-10-05",
    expected: {
      financialMeaning: "EXPENSE",
      isEligibleExpense: true,
      category: "FUEL",
      spendingTier: "ESSENTIAL",
      tags: ["fuel", "petrol"],
    },
  },
  {
    id: "FUEL-003",
    description: "IOCL PETROL OUTLET DELHI CANTT",
    amount: 2200.0,
    direction: "DEBIT",
    date: "2026-10-08",
    expected: {
      financialMeaning: "EXPENSE",
      isEligibleExpense: true,
      category: "FUEL",
      spendingTier: "ESSENTIAL",
      tags: ["fuel", "petrol"],
    },
  },
  {
    id: "FUEL-004",
    description: "BPCL FUEL STATION CHENNAI HIGHWAY",
    amount: 3100.0,
    direction: "DEBIT",
    date: "2026-10-10",
    expected: {
      financialMeaning: "EXPENSE",
      isEligibleExpense: true,
      category: "FUEL",
      spendingTier: "ESSENTIAL",
      tags: ["fuel", "highway"],
    },
  },

  // =========================================================================
  // 3. SHOPPING (Retail, Apparel, Electronics, Discretionary vs Luxury)
  // =========================================================================
  {
    id: "SHOP-001",
    description: "AMAZON SELLER RETAIL INDIA BANGALORE",
    amount: 1499.0,
    direction: "DEBIT",
    date: "2026-10-03",
    expected: {
      financialMeaning: "EXPENSE",
      isEligibleExpense: true,
      category: "SHOPPING",
      spendingTier: "GOOD_TO_HAVE",
      tags: ["shopping", "online", "retail"],
    },
  },
  {
    id: "SHOP-002",
    description: "FLIPKART INTERNET PVT LTD ELECTRONICS",
    amount: 4999.0,
    direction: "DEBIT",
    date: "2026-10-05",
    expected: {
      financialMeaning: "EXPENSE",
      isEligibleExpense: true,
      category: "SHOPPING",
      spendingTier: "GOOD_TO_HAVE",
      tags: ["shopping", "electronics"],
    },
  },
  {
    id: "SHOP-003",
    description: "MYNTRA DESIGNS APPAREL STORE",
    amount: 2350.0,
    direction: "DEBIT",
    date: "2026-10-06",
    expected: {
      financialMeaning: "EXPENSE",
      isEligibleExpense: true,
      category: "SHOPPING",
      spendingTier: "GOOD_TO_HAVE",
      tags: ["shopping", "clothing"],
    },
  },
  {
    id: "SHOP-004",
    description: "ZARA PHOENIX MARKETCITY MUMBAI",
    amount: 8990.0,
    direction: "DEBIT",
    date: "2026-10-07",
    expected: {
      financialMeaning: "EXPENSE",
      isEligibleExpense: true,
      category: "SHOPPING",
      spendingTier: "LUXURY",
      tags: ["shopping", "clothing", "luxury"],
    },
  },
  {
    id: "SHOP-005",
    description: "UNIQLO INDIA RETAIL STORE",
    amount: 3990.0,
    direction: "DEBIT",
    date: "2026-10-09",
    expected: {
      financialMeaning: "EXPENSE",
      isEligibleExpense: true,
      category: "SHOPPING",
      spendingTier: "GOOD_TO_HAVE",
      tags: ["shopping", "clothing"],
    },
  },

  // =========================================================================
  // 4. BILLS & UTILITIES (Electricity, Water, Gas, Telecom, Internet)
  // =========================================================================
  {
    id: "BILL-001",
    description: "BESCOM ELECTRICITY BILL PAYMENT BANGALORE",
    amount: 1850.0,
    direction: "DEBIT",
    date: "2026-10-02",
    expected: {
      financialMeaning: "EXPENSE",
      isEligibleExpense: true,
      category: "BILLS",
      spendingTier: "ESSENTIAL",
      tags: ["bills", "utility", "electricity"],
    },
  },
  {
    id: "BILL-002",
    description: "TATA POWER ELECTRICITY MUMBAI BILL",
    amount: 2400.0,
    direction: "DEBIT",
    date: "2026-10-03",
    expected: {
      financialMeaning: "EXPENSE",
      isEligibleExpense: true,
      category: "BILLS",
      spendingTier: "ESSENTIAL",
      tags: ["bills", "electricity"],
    },
  },
  {
    id: "BILL-003",
    description: "BWSSB WATER SUPPLY BILL OCT 2026",
    amount: 620.0,
    direction: "DEBIT",
    date: "2026-10-04",
    expected: {
      financialMeaning: "EXPENSE",
      isEligibleExpense: true,
      category: "BILLS",
      spendingTier: "ESSENTIAL",
      tags: ["bills", "utility", "water"],
    },
  },
  {
    id: "BILL-004",
    description: "AIRTEL BROADBAND FIBER MONTHLY RECHARGE",
    amount: 1179.0,
    direction: "DEBIT",
    date: "2026-10-05",
    expected: {
      financialMeaning: "EXPENSE",
      isEligibleExpense: true,
      category: "BILLS",
      spendingTier: "ESSENTIAL",
      tags: ["bills", "internet", "broadband"],
    },
  },
  {
    id: "BILL-005",
    description: "INDANE LPG GAS CYLINDER REFILL",
    amount: 920.0,
    direction: "DEBIT",
    date: "2026-10-07",
    expected: {
      financialMeaning: "EXPENSE",
      isEligibleExpense: true,
      category: "BILLS",
      spendingTier: "ESSENTIAL",
      tags: ["bills", "utility", "gas"],
    },
  },
  {
    id: "BILL-006",
    description: "JIO POSTPAID MOBILE BILL PAYMENT",
    amount: 470.0,
    direction: "DEBIT",
    date: "2026-10-08",
    expected: {
      financialMeaning: "EXPENSE",
      isEligibleExpense: true,
      category: "BILLS",
      spendingTier: "ESSENTIAL",
      tags: ["bills", "mobile"],
    },
  },

  // =========================================================================
  // 5. ENTERTAINMENT (Movies, Gaming, Outings)
  // =========================================================================
  {
    id: "ENT-001",
    description: "BOOKMYSHOW TICKETS PVR CINEMAS",
    amount: 900.0,
    direction: "DEBIT",
    date: "2026-10-04",
    expected: {
      financialMeaning: "EXPENSE",
      isEligibleExpense: true,
      category: "ENTERTAINMENT",
      spendingTier: "GOOD_TO_HAVE",
      tags: ["entertainment", "movie", "weekend"],
    },
  },
  {
    id: "ENT-002",
    description: "PVR INOX LTD MOVIE THEATRE CONCESSIONS",
    amount: 650.0,
    direction: "DEBIT",
    date: "2026-10-04",
    expected: {
      financialMeaning: "EXPENSE",
      isEligibleExpense: true,
      category: "ENTERTAINMENT",
      spendingTier: "GOOD_TO_HAVE",
      tags: ["entertainment", "movie"],
    },
  },
  {
    id: "ENT-003",
    description: "STEAM PURCHASE VALVE CORPORATION GAMES",
    amount: 1999.0,
    direction: "DEBIT",
    date: "2026-10-07",
    expected: {
      financialMeaning: "EXPENSE",
      isEligibleExpense: true,
      category: "ENTERTAINMENT",
      spendingTier: "GOOD_TO_HAVE",
      tags: ["entertainment", "gaming"],
    },
  },

  // =========================================================================
  // 6. HEALTHCARE & MEDICAL (Pharmacy, Doctor, Diagnostics)
  // =========================================================================
  {
    id: "HLTH-001",
    description: "APOLLO PHARMACY MEDICALS BANGALORE",
    amount: 850.0,
    direction: "DEBIT",
    date: "2026-10-03",
    expected: {
      financialMeaning: "EXPENSE",
      isEligibleExpense: true,
      category: "HEALTH",
      spendingTier: "ESSENTIAL",
      tags: ["health", "pharmacy", "medicine"],
    },
  },
  {
    id: "HLTH-002",
    description: "PRACTO DOCTOR CONSULTATION ONLINE",
    amount: 700.0,
    direction: "DEBIT",
    date: "2026-10-06",
    expected: {
      financialMeaning: "EXPENSE",
      isEligibleExpense: true,
      category: "HEALTH",
      spendingTier: "ESSENTIAL",
      tags: ["health", "doctor"],
    },
  },
  {
    id: "HLTH-003",
    description: "DR LAL PATHLABS DIAGNOSTICS BLOOD TEST",
    amount: 1600.0,
    direction: "DEBIT",
    date: "2026-10-08",
    expected: {
      financialMeaning: "EXPENSE",
      isEligibleExpense: true,
      category: "HEALTH",
      spendingTier: "ESSENTIAL",
      tags: ["health", "lab", "diagnostics"],
    },
  },
  {
    id: "HLTH-004",
    description: "FORTIS HOSPITAL OUTPATIENT PHARMACY",
    amount: 3200.0,
    direction: "DEBIT",
    date: "2026-10-09",
    expected: {
      financialMeaning: "EXPENSE",
      isEligibleExpense: true,
      category: "HEALTH",
      spendingTier: "ESSENTIAL",
      tags: ["health", "hospital"],
    },
  },

  // =========================================================================
  // 7. TRAVEL & COMMUTE (Rideshare, Public Transit, Trains, Flights, Tolls)
  // =========================================================================
  {
    id: "TRVL-001",
    description: "UBER INDIA RIDES BANGALORE",
    amount: 340.0,
    direction: "DEBIT",
    date: "2026-10-02",
    expected: {
      financialMeaning: "EXPENSE",
      isEligibleExpense: true,
      category: "TRAVEL",
      spendingTier: "ESSENTIAL",
      tags: ["travel", "commute", "cab"],
    },
  },
  {
    id: "TRVL-002",
    description: "OLA CABS RIDE MUMBAI",
    amount: 280.0,
    direction: "DEBIT",
    date: "2026-10-03",
    expected: {
      financialMeaning: "EXPENSE",
      isEligibleExpense: true,
      category: "TRAVEL",
      spendingTier: "ESSENTIAL",
      tags: ["travel", "commute", "cab"],
    },
  },
  {
    id: "TRVL-003",
    description: "IRCTC RAILWAY TICKET NEW DELHI TO JAIPUR",
    amount: 950.0,
    direction: "DEBIT",
    date: "2026-10-04",
    expected: {
      financialMeaning: "EXPENSE",
      isEligibleExpense: true,
      category: "TRAVEL",
      spendingTier: "GOOD_TO_HAVE",
      tags: ["travel", "train", "railway"],
    },
  },
  {
    id: "TRVL-004",
    description: "MAKEMYTRIP FLIGHT TICKET BOOKING",
    amount: 6800.0,
    direction: "DEBIT",
    date: "2026-10-05",
    expected: {
      financialMeaning: "EXPENSE",
      isEligibleExpense: true,
      category: "TRAVEL",
      spendingTier: "GOOD_TO_HAVE",
      tags: ["travel", "flight", "vacation"],
    },
  },
  {
    id: "TRVL-005",
    description: "FASTAG TOLL PLAZA HIGHWAY CHARGE",
    amount: 140.0,
    direction: "DEBIT",
    date: "2026-10-06",
    expected: {
      financialMeaning: "EXPENSE",
      isEligibleExpense: true,
      category: "TRAVEL",
      spendingTier: "ESSENTIAL",
      tags: ["travel", "toll"],
    },
  },
  {
    id: "TRVL-006",
    description: "NAMMA METRO CARD RECHARGE SMARTCARD",
    amount: 500.0,
    direction: "DEBIT",
    date: "2026-10-07",
    expected: {
      financialMeaning: "EXPENSE",
      isEligibleExpense: true,
      category: "TRAVEL",
      spendingTier: "ESSENTIAL",
      tags: ["travel", "commute", "metro"],
    },
  },

  // =========================================================================
  // 8. EDUCATION (Courses, Certifications, Books, Tuition)
  // =========================================================================
  {
    id: "EDU-001",
    description: "COURSERA SUBSCRIPTION COURSE CERTIFICATE",
    amount: 3200.0,
    direction: "DEBIT",
    date: "2026-10-03",
    expected: {
      financialMeaning: "EXPENSE",
      isEligibleExpense: true,
      category: "EDUCATION",
      spendingTier: "GOOD_TO_HAVE",
      tags: ["education", "course", "learning"],
    },
  },
  {
    id: "EDU-002",
    description: "UDEMY ONLINE LEARNING PYTHON COURSE",
    amount: 499.0,
    direction: "DEBIT",
    date: "2026-10-05",
    expected: {
      financialMeaning: "EXPENSE",
      isEligibleExpense: true,
      category: "EDUCATION",
      spendingTier: "GOOD_TO_HAVE",
      tags: ["education", "course"],
    },
  },
  {
    id: "EDU-003",
    description: "ALLEN CAREER INSTITUTE TUITION FEE",
    amount: 25000.0,
    direction: "DEBIT",
    date: "2026-10-08",
    expected: {
      financialMeaning: "EXPENSE",
      isEligibleExpense: true,
      category: "EDUCATION",
      spendingTier: "ESSENTIAL",
      tags: ["education", "tuition", "coaching"],
    },
  },

  // =========================================================================
  // 9. SUBSCRIPTIONS (OTT, Music, Cloud Services)
  // =========================================================================
  {
    id: "SUB-001",
    description: "NETFLIX ENTERTAINMENT SUBSCRIPTION MUMBAI",
    amount: 649.0,
    direction: "DEBIT",
    date: "2026-10-01",
    expected: {
      financialMeaning: "EXPENSE",
      isEligibleExpense: true,
      category: "SUBSCRIPTION",
      spendingTier: "GOOD_TO_HAVE",
      tags: ["subscription", "streaming", "ott"],
    },
  },
  {
    id: "SUB-002",
    description: "SPOTIFY INDIA MONTHLY PREMIUM MUSIC",
    amount: 119.0,
    direction: "DEBIT",
    date: "2026-10-02",
    expected: {
      financialMeaning: "EXPENSE",
      isEligibleExpense: true,
      category: "SUBSCRIPTION",
      spendingTier: "GOOD_TO_HAVE",
      tags: ["subscription", "music"],
    },
  },
  {
    id: "SUB-003",
    description: "GOOGLE STORAGE CLOUD GOOGLE ONE",
    amount: 130.0,
    direction: "DEBIT",
    date: "2026-10-03",
    expected: {
      financialMeaning: "EXPENSE",
      isEligibleExpense: true,
      category: "SUBSCRIPTION",
      spendingTier: "ESSENTIAL",
      tags: ["subscription", "cloud", "tech"],
    },
  },
  {
    id: "SUB-004",
    description: "GITHUB COPILOT SUBSCRIPTION TECH",
    amount: 850.0,
    direction: "DEBIT",
    date: "2026-10-04",
    expected: {
      financialMeaning: "EXPENSE",
      isEligibleExpense: true,
      category: "SUBSCRIPTION",
      spendingTier: "ESSENTIAL",
      tags: ["subscription", "software", "tech"],
    },
  },
  {
    id: "SUB-005",
    description: "DISNEY PLUS HOTSTAR ANNUAL PREMIUM",
    amount: 1499.0,
    direction: "DEBIT",
    date: "2026-10-05",
    expected: {
      financialMeaning: "EXPENSE",
      isEligibleExpense: true,
      category: "SUBSCRIPTION",
      spendingTier: "GOOD_TO_HAVE",
      tags: ["subscription", "streaming"],
    },
  },

  // =========================================================================
  // 10. GIFTS & DONATIONS
  // =========================================================================
  {
    id: "GIFT-001",
    description: "FERNS N PETALS FLOWERS AND CAKE GIFT",
    amount: 1250.0,
    direction: "DEBIT",
    date: "2026-10-04",
    expected: {
      financialMeaning: "EXPENSE",
      isEligibleExpense: true,
      category: "GIFT",
      spendingTier: "GOOD_TO_HAVE",
      tags: ["gift", "flowers", "celebration"],
    },
  },
  {
    id: "GIFT-002",
    description: "CRY CHILD RIGHTS AND YOU CHARITY DONATION",
    amount: 2000.0,
    direction: "DEBIT",
    date: "2026-10-06",
    expected: {
      financialMeaning: "EXPENSE",
      isEligibleExpense: true,
      category: "GIFT",
      spendingTier: "GOOD_TO_HAVE",
      tags: ["gift", "charity", "donation"],
    },
  },

  // =========================================================================
  // 11. OTHER EXPENSES & UNCLASSIFIED
  // =========================================================================
  {
    id: "OTH-001",
    description: "MUNICIPAL CORPORATION PROPERTY TAX PAYMENT",
    amount: 4500.0,
    direction: "DEBIT",
    date: "2026-10-05",
    expected: {
      financialMeaning: "EXPENSE",
      isEligibleExpense: true,
      category: "OTHER",
      spendingTier: "ESSENTIAL",
      tags: ["tax", "government"],
    },
  },
  {
    id: "OTH-002",
    description: "KEYSMITH AND LOCK REPAIR CASH",
    amount: 350.0,
    direction: "DEBIT",
    date: "2026-10-06",
    expected: {
      financialMeaning: "EXPENSE",
      isEligibleExpense: true,
      category: "OTHER",
      spendingTier: "UNCLASSIFIED",
      tags: ["maintenance"],
    },
  },

  // =========================================================================
  // 12. SALARY CREDITS & INCOMING INCOME (Must NEVER be classified as Expense)
  // =========================================================================
  {
    id: "INC-001",
    description: "NEFT CR-INFOSYS TECHNOLOGIES LTD-SALARY OCT 2026",
    amount: 95000.0,
    direction: "CREDIT",
    date: "2026-10-01",
    expected: {
      financialMeaning: "INCOME",
      isEligibleExpense: false,
      category: "OTHER",
      spendingTier: "UNCLASSIFIED",
      tags: ["salary", "income"],
    },
  },
  {
    id: "INC-002",
    description: "ACH CR TATA CONSULTANCY SERVICES SALARY",
    amount: 110000.0,
    direction: "CREDIT",
    date: "2026-10-01",
    expected: {
      financialMeaning: "INCOME",
      isEligibleExpense: false,
      category: "OTHER",
      spendingTier: "UNCLASSIFIED",
      tags: ["salary", "payroll"],
    },
  },
  {
    id: "INC-003",
    description: "IMPS CR-UPWORK FREELANCE CLIENT PAYMENT",
    amount: 32000.0,
    direction: "CREDIT",
    date: "2026-10-05",
    expected: {
      financialMeaning: "INCOME",
      isEligibleExpense: false,
      category: "OTHER",
      spendingTier: "UNCLASSIFIED",
      tags: ["income", "freelance"],
    },
  },
  {
    id: "INC-004",
    description: "DIVIDEND CREDITED HDFC BANK LTD",
    amount: 1450.0,
    direction: "CREDIT",
    date: "2026-10-08",
    expected: {
      financialMeaning: "INCOME",
      isEligibleExpense: false,
      category: "OTHER",
      spendingTier: "UNCLASSIFIED",
      tags: ["income", "dividend", "investment"],
    },
  },
  {
    id: "INC-005",
    description: "INTEREST PAID ON SAVINGS A/C Q3",
    amount: 875.0,
    direction: "CREDIT",
    date: "2026-10-10",
    expected: {
      financialMeaning: "INCOME",
      isEligibleExpense: false,
      category: "OTHER",
      spendingTier: "UNCLASSIFIED",
      tags: ["income", "interest"],
    },
  },

  // =========================================================================
  // 13. TRANSFERS, DEPOSITS, REFUNDS (Must NOT be counted as Expense)
  // =========================================================================
  {
    id: "TRF-001",
    description: "TRANSFER TO FIXED DEPOSIT A/C 981247",
    amount: 50000.0,
    direction: "DEBIT",
    date: "2026-10-02",
    expected: {
      financialMeaning: "TRANSFER",
      isEligibleExpense: false,
      category: "OTHER",
      spendingTier: "UNCLASSIFIED",
      tags: ["transfer", "savings"],
    },
  },
  {
    id: "TRF-002",
    description: "AUTO SWEEP TRANSFER TO SAVINGS LINKED",
    amount: 20000.0,
    direction: "CREDIT",
    date: "2026-10-03",
    expected: {
      financialMeaning: "TRANSFER",
      isEligibleExpense: false,
      category: "OTHER",
      spendingTier: "UNCLASSIFIED",
      tags: ["transfer", "sweep"],
    },
  },
  {
    id: "TRF-003",
    description: "REFUND PROCESSED FLIPKART RETURN ORDER",
    amount: 1499.0,
    direction: "CREDIT",
    date: "2026-10-06",
    expected: {
      financialMeaning: "TRANSFER",
      isEligibleExpense: false,
      category: "SHOPPING",
      spendingTier: "UNCLASSIFIED",
      tags: ["refund", "shopping"],
    },
  },
  {
    id: "TRF-004",
    description: "CREDIT CARD BILLPAY REVERSAL CHARGES",
    amount: 450.0,
    direction: "CREDIT",
    date: "2026-10-07",
    expected: {
      financialMeaning: "TRANSFER",
      isEligibleExpense: false,
      category: "BILLS",
      spendingTier: "UNCLASSIFIED",
      tags: ["reversal", "refund"],
    },
  },

  // =========================================================================
  // 14. BALANCE ROWS (Opening/Closing Balance: Must NEVER be an expense row)
  // =========================================================================
  {
    id: "BAL-001",
    description: "OPENING BALANCE B/F AS ON 01-OCT-2026",
    amount: 45820.75,
    direction: "CREDIT",
    date: "2026-10-01",
    expected: {
      financialMeaning: "BALANCE_SUMMARY",
      isEligibleExpense: false,
      category: "OTHER",
      spendingTier: "UNCLASSIFIED",
      tags: ["balance", "statement"],
    },
  },
  {
    id: "BAL-002",
    description: "CLOSING BALANCE C/F AS ON 31-OCT-2026",
    amount: 62410.25,
    direction: "CREDIT",
    date: "2026-10-31",
    expected: {
      financialMeaning: "BALANCE_SUMMARY",
      isEligibleExpense: false,
      category: "OTHER",
      spendingTier: "UNCLASSIFIED",
      tags: ["balance", "statement"],
    },
  },

  // =========================================================================
  // 15. AMBIGUOUS, UNKNOWN & EDGE CASES (Documented review candidates)
  // =========================================================================
  {
    id: "AMB-001",
    description: "AMAZON PAY BILLS UTILITY OR RETAIL",
    amount: 1200.0,
    direction: "DEBIT",
    date: "2026-10-04",
    expected: {
      financialMeaning: "EXPENSE",
      isEligibleExpense: true,
      category: "BILLS",
      spendingTier: "ESSENTIAL",
      tags: ["bills", "amazon-pay"],
      isAmbiguous: true,
      ambiguityReason: "Amazon Pay could be shopping or utility bills; narration mentions BILLS.",
    },
  },
  {
    id: "AMB-002",
    description: "POS 981729 STORE MUMBAI MH",
    amount: 1540.0,
    direction: "DEBIT",
    date: "2026-10-06",
    expected: {
      financialMeaning: "EXPENSE",
      isEligibleExpense: true,
      category: "OTHER",
      spendingTier: "UNCLASSIFIED",
      tags: [],
      isAmbiguous: true,
      ambiguityReason: "Generic POS terminal narration without discernible merchant identity.",
    },
  },
  {
    id: "AMB-003",
    description: "AIRTEL XSTREAM OTT STREAMING",
    amount: 149.0,
    direction: "DEBIT",
    date: "2026-10-07",
    expected: {
      financialMeaning: "EXPENSE",
      isEligibleExpense: true,
      category: "SUBSCRIPTION",
      spendingTier: "GOOD_TO_HAVE",
      tags: ["subscription", "streaming"],
      isAmbiguous: true,
      ambiguityReason: "Airtel is typically broadband/bills, but Xstream OTT is a media subscription.",
    },
  },
  {
    id: "AMB-004",
    description: "UPI/MISC SERVICE/9871029384",
    amount: 250.0,
    direction: "DEBIT",
    date: "2026-10-08",
    expected: {
      financialMeaning: "EXPENSE",
      isEligibleExpense: true,
      category: "OTHER",
      spendingTier: "UNCLASSIFIED",
      tags: [],
      isAmbiguous: true,
      ambiguityReason: "Opaque peer-to-peer or small vendor UPI without category hints.",
    },
  },

  // =========================================================================
  // 16. MALFORMED & INVALID ROWS (Zero amounts, blank text, non-financial)
  // =========================================================================
  {
    id: "INV-001",
    description: "ZERO AMOUNT TEST ROW",
    amount: 0.0,
    direction: "DEBIT",
    date: "2026-10-09",
    expected: {
      financialMeaning: "INVALID",
      isEligibleExpense: false,
      category: "OTHER",
      spendingTier: "UNCLASSIFIED",
      tags: [],
      isAmbiguous: true,
      ambiguityReason: "Zero monetary amount should be rejected as invalid transaction row.",
    },
  },
  {
    id: "INV-002",
    description: "",
    amount: 500.0,
    direction: "DEBIT",
    date: "2026-10-09",
    expected: {
      financialMeaning: "INVALID",
      isEligibleExpense: false,
      category: "OTHER",
      spendingTier: "UNCLASSIFIED",
      tags: [],
      isAmbiguous: true,
      ambiguityReason: "Blank description has zero semantic content for classification.",
    },
  },

  // =========================================================================
  // 17. EXPANDED BENCHMARK: FOOD (Spelling variations, abbreviations, multilingual)
  // =========================================================================
  {
    id: "FOOD-009",
    description: "POS/SWG*REST-BLR-01",
    amount: 540.0,
    direction: "DEBIT",
    date: "2026-10-10",
    expected: {
      financialMeaning: "EXPENSE",
      isEligibleExpense: true,
      category: "FOOD",
      spendingTier: "GOOD_TO_HAVE",
      tags: ["food", "delivery"],
    },
  },
  {
    id: "FOOD-010",
    description: "SWIGY INSTAMART ORDER 4819",
    amount: 320.0,
    direction: "DEBIT",
    date: "2026-10-10",
    expected: {
      financialMeaning: "EXPENSE",
      isEligibleExpense: true,
      category: "FOOD",
      spendingTier: "ESSENTIAL",
      tags: ["groceries", "quick-commerce"],
    },
  },
  {
    id: "FOOD-011",
    description: "ZOMTO ONLINE MEALS DELIVERY",
    amount: 420.0,
    direction: "DEBIT",
    date: "2026-10-11",
    expected: {
      financialMeaning: "EXPENSE",
      isEligibleExpense: true,
      category: "FOOD",
      spendingTier: "GOOD_TO_HAVE",
      tags: ["food", "dining"],
    },
  },
  {
    id: "FOOD-012",
    description: "SHARMA KIRANA STORE JAIPUR",
    amount: 1150.0,
    direction: "DEBIT",
    date: "2026-10-11",
    expected: {
      financialMeaning: "EXPENSE",
      isEligibleExpense: true,
      category: "FOOD",
      spendingTier: "ESSENTIAL",
      tags: ["groceries", "local"],
    },
  },
  {
    id: "FOOD-013",
    description: "MURTHY TIFFIN & DHABA EXPRESS",
    amount: 180.0,
    direction: "DEBIT",
    date: "2026-10-12",
    expected: {
      financialMeaning: "EXPENSE",
      isEligibleExpense: true,
      category: "FOOD",
      spendingTier: "GOOD_TO_HAVE",
      tags: ["food", "dining"],
    },
  },
  {
    id: "FOOD-014",
    description: "BLUE TOKAI COFFEE ROASTERS BANDRA",
    amount: 680.0,
    direction: "DEBIT",
    date: "2026-10-12",
    expected: {
      financialMeaning: "EXPENSE",
      isEligibleExpense: true,
      category: "FOOD",
      spendingTier: "LUXURY",
      tags: ["coffee", "artisanal", "discretionary"],
    },
  },

  // =========================================================================
  // 18. EXPANDED BENCHMARK: FUEL (Abbreviated, full merchant name variations)
  // =========================================================================
  {
    id: "FUEL-005",
    description: "POS/BPCL-RETAIL-OUTLET-DELHI",
    amount: 2000.0,
    direction: "DEBIT",
    date: "2026-10-10",
    expected: {
      financialMeaning: "EXPENSE",
      isEligibleExpense: true,
      category: "FUEL",
      spendingTier: "ESSENTIAL",
      tags: ["fuel", "petrol"],
    },
  },
  {
    id: "FUEL-006",
    description: "INDIAN OIL CO LTD PETROL AUTO",
    amount: 500.0,
    direction: "DEBIT",
    date: "2026-10-11",
    expected: {
      financialMeaning: "EXPENSE",
      isEligibleExpense: true,
      category: "FUEL",
      spendingTier: "ESSENTIAL",
      tags: ["fuel", "petrol"],
    },
  },
  {
    id: "FUEL-007",
    description: "SHELL SELECT CONVENIENCE STORE FUEL",
    amount: 3200.0,
    direction: "DEBIT",
    date: "2026-10-12",
    expected: {
      financialMeaning: "EXPENSE",
      isEligibleExpense: true,
      category: "FUEL",
      spendingTier: "ESSENTIAL",
      tags: ["fuel", "petrol"],
    },
  },

  // =========================================================================
  // 19. EXPANDED BENCHMARK: SHOPPING (Retail variations, apparel, electronics)
  // =========================================================================
  {
    id: "SHOP-007",
    description: "AMZON MKTPLACE RETAIL ORDER",
    amount: 1499.0,
    direction: "DEBIT",
    date: "2026-10-10",
    expected: {
      financialMeaning: "EXPENSE",
      isEligibleExpense: true,
      category: "SHOPPING",
      spendingTier: "GOOD_TO_HAVE",
      tags: ["shopping", "retail"],
    },
  },
  {
    id: "SHOP-008",
    description: "FLPKRT INTERNET COMMERCE BLR",
    amount: 2299.0,
    direction: "DEBIT",
    date: "2026-10-10",
    expected: {
      financialMeaning: "EXPENSE",
      isEligibleExpense: true,
      category: "SHOPPING",
      spendingTier: "GOOD_TO_HAVE",
      tags: ["shopping", "electronics"],
    },
  },
  {
    id: "SHOP-009",
    description: "ZARA CLOTHING PHOENIX MALL",
    amount: 4990.0,
    direction: "DEBIT",
    date: "2026-10-11",
    expected: {
      financialMeaning: "EXPENSE",
      isEligibleExpense: true,
      category: "SHOPPING",
      spendingTier: "LUXURY",
      tags: ["shopping", "clothing", "luxury"],
    },
  },
  {
    id: "SHOP-010",
    description: "CROMA ELECTRONICS STORE KORAMANGALA",
    amount: 3499.0,
    direction: "DEBIT",
    date: "2026-10-11",
    expected: {
      financialMeaning: "EXPENSE",
      isEligibleExpense: true,
      category: "SHOPPING",
      spendingTier: "GOOD_TO_HAVE",
      tags: ["shopping", "electronics"],
    },
  },
  {
    id: "SHOP-011",
    description: "DECATHLON SPORTS INDIA GURGAON",
    amount: 1890.0,
    direction: "DEBIT",
    date: "2026-10-12",
    expected: {
      financialMeaning: "EXPENSE",
      isEligibleExpense: true,
      category: "SHOPPING",
      spendingTier: "GOOD_TO_HAVE",
      tags: ["shopping", "sports"],
    },
  },

  // =========================================================================
  // 20. EXPANDED BENCHMARK: BILLS (ACH, Rent, Bank Maintenance Fees)
  // =========================================================================
  {
    id: "BILLS-009",
    description: "ACH-TATA POWER-MUMBAI-OCT",
    amount: 2150.0,
    direction: "DEBIT",
    date: "2026-10-10",
    expected: {
      financialMeaning: "EXPENSE",
      isEligibleExpense: true,
      category: "BILLS",
      spendingTier: "ESSENTIAL",
      tags: ["bills", "electricity"],
    },
  },
  {
    id: "BILLS-010",
    description: "NEFT-INP-RENT-PAYMENT-OCTOBER",
    amount: 28000.0,
    direction: "DEBIT",
    date: "2026-10-10",
    expected: {
      financialMeaning: "EXPENSE",
      isEligibleExpense: true,
      category: "BILLS",
      spendingTier: "ESSENTIAL",
      tags: ["bills", "rent"],
    },
  },
  {
    id: "BILLS-011",
    description: "AIRTEL BROADBAND FIBER BILL",
    amount: 1179.0,
    direction: "DEBIT",
    date: "2026-10-11",
    expected: {
      financialMeaning: "EXPENSE",
      isEligibleExpense: true,
      category: "BILLS",
      spendingTier: "ESSENTIAL",
      tags: ["bills", "internet", "broadband"],
    },
  },
  {
    id: "BILLS-012",
    description: "ANNUAL DEBIT CARD AMC CHARGE",
    amount: 590.0,
    direction: "DEBIT",
    date: "2026-10-11",
    expected: {
      financialMeaning: "EXPENSE",
      isEligibleExpense: true,
      category: "BILLS",
      spendingTier: "ESSENTIAL",
      tags: ["bills", "bank_fee"],
    },
  },
  {
    id: "BILLS-013",
    description: "SMS ALERT CHARGES Q3",
    amount: 59.0,
    direction: "DEBIT",
    date: "2026-10-12",
    expected: {
      financialMeaning: "EXPENSE",
      isEligibleExpense: true,
      category: "BILLS",
      spendingTier: "ESSENTIAL",
      tags: ["bills", "bank_fee"],
    },
  },
  {
    id: "BILLS-014",
    description: "ATM WITHDRAWAL INTERCHANGE FEE",
    amount: 23.6,
    direction: "DEBIT",
    date: "2026-10-12",
    expected: {
      financialMeaning: "EXPENSE",
      isEligibleExpense: true,
      category: "BILLS",
      spendingTier: "ESSENTIAL",
      tags: ["bills", "bank_fee"],
    },
  },
  {
    id: "BILLS-015",
    description: "FOREX MARKUP CHARGES CROSS-BORDER",
    amount: 354.0,
    direction: "DEBIT",
    date: "2026-10-12",
    expected: {
      financialMeaning: "EXPENSE",
      isEligibleExpense: true,
      category: "BILLS",
      spendingTier: "ESSENTIAL",
      tags: ["bills", "bank_fee"],
    },
  },

  // =========================================================================
  // 21. EXPANDED BENCHMARK: ENTERTAINMENT (Cinema, recreation)
  // =========================================================================
  {
    id: "ENT-004",
    description: "BOOKMYSHOW TICKETS IMAX NOIDA",
    amount: 1120.0,
    direction: "DEBIT",
    date: "2026-10-10",
    expected: {
      financialMeaning: "EXPENSE",
      isEligibleExpense: true,
      category: "ENTERTAINMENT",
      spendingTier: "GOOD_TO_HAVE",
      tags: ["entertainment", "movie", "weekend"],
    },
  },
  {
    id: "ENT-005",
    description: "SMASH BOWLING ARENA ENTERTAINMENT",
    amount: 1850.0,
    direction: "DEBIT",
    date: "2026-10-11",
    expected: {
      financialMeaning: "EXPENSE",
      isEligibleExpense: true,
      category: "ENTERTAINMENT",
      spendingTier: "GOOD_TO_HAVE",
      tags: ["entertainment", "recreation"],
    },
  },

  // =========================================================================
  // 22. EXPANDED BENCHMARK: HEALTH (Diagnostics, Pharmacy, Fitness)
  // =========================================================================
  {
    id: "HLT-005",
    description: "DR LAL PATHLABS BLOOD DIAGNOSTICS",
    amount: 1650.0,
    direction: "DEBIT",
    date: "2026-10-10",
    expected: {
      financialMeaning: "EXPENSE",
      isEligibleExpense: true,
      category: "HEALTH",
      spendingTier: "ESSENTIAL",
      tags: ["health", "lab", "diagnostics"],
    },
  },
  {
    id: "HLT-006",
    description: "APOLLO PHARMACY RETREAT HYDERABAD",
    amount: 640.0,
    direction: "DEBIT",
    date: "2026-10-11",
    expected: {
      financialMeaning: "EXPENSE",
      isEligibleExpense: true,
      category: "HEALTH",
      spendingTier: "ESSENTIAL",
      tags: ["health", "pharmacy", "medicine"],
    },
  },
  {
    id: "HLT-007",
    description: "CULT FIT ANNUAL FITNESS MEMBERSHIP",
    amount: 14500.0,
    direction: "DEBIT",
    date: "2026-10-12",
    expected: {
      financialMeaning: "EXPENSE",
      isEligibleExpense: true,
      category: "HEALTH",
      spendingTier: "GOOD_TO_HAVE",
      tags: ["health", "fitness"],
    },
  },

  // =========================================================================
  // 23. EXPANDED BENCHMARK: TRAVEL (Cab abbreviation, FASTag, flights)
  // =========================================================================
  {
    id: "TRV-007",
    description: "UBR* TRIP RIDE DELHI NCR",
    amount: 340.0,
    direction: "DEBIT",
    date: "2026-10-10",
    expected: {
      financialMeaning: "EXPENSE",
      isEligibleExpense: true,
      category: "TRAVEL",
      spendingTier: "ESSENTIAL",
      tags: ["travel", "commute", "cab"],
    },
  },
  {
    id: "TRV-008",
    description: "IHMCL FASTAG TOLL PLAZA CHARGE",
    amount: 180.0,
    direction: "DEBIT",
    date: "2026-10-11",
    expected: {
      financialMeaning: "EXPENSE",
      isEligibleExpense: true,
      category: "TRAVEL",
      spendingTier: "ESSENTIAL",
      tags: ["travel", "toll"],
    },
  },
  {
    id: "TRV-009",
    description: "MAKEMYTRIP HOLIDAYS FLIGHT TICKET",
    amount: 6850.0,
    direction: "DEBIT",
    date: "2026-10-12",
    expected: {
      financialMeaning: "EXPENSE",
      isEligibleExpense: true,
      category: "TRAVEL",
      spendingTier: "GOOD_TO_HAVE",
      tags: ["travel", "flight", "vacation"],
    },
  },

  // =========================================================================
  // 24. EXPANDED BENCHMARK: EDUCATION (School fees, online courses)
  // =========================================================================
  {
    id: "EDU-004",
    description: "ACH-DELHI-PUBLIC-SCHL-TERM-FEE",
    amount: 18500.0,
    direction: "DEBIT",
    date: "2026-10-10",
    expected: {
      financialMeaning: "EXPENSE",
      isEligibleExpense: true,
      category: "EDUCATION",
      spendingTier: "ESSENTIAL",
      tags: ["education", "school"],
    },
  },
  {
    id: "EDU-005",
    description: "UDEMY ONLINE COURSE SUBSCRIPTION",
    amount: 499.0,
    direction: "DEBIT",
    date: "2026-10-11",
    expected: {
      financialMeaning: "EXPENSE",
      isEligibleExpense: true,
      category: "EDUCATION",
      spendingTier: "GOOD_TO_HAVE",
      tags: ["education", "course"],
    },
  },

  // =========================================================================
  // 25. EXPANDED BENCHMARK: SUBSCRIPTION (Streaming, Cloud, SaaS, News)
  // =========================================================================
  {
    id: "SUB-007",
    description: "ACH-SPOTIFY-INDIA-MONTHLY",
    amount: 119.0,
    direction: "DEBIT",
    date: "2026-10-10",
    expected: {
      financialMeaning: "EXPENSE",
      isEligibleExpense: true,
      category: "SUBSCRIPTION",
      spendingTier: "GOOD_TO_HAVE",
      tags: ["subscription", "music"],
    },
  },
  {
    id: "SUB-008",
    description: "APPLE.COM/BILL RECURRENT STORAGE",
    amount: 75.0,
    direction: "DEBIT",
    date: "2026-10-10",
    expected: {
      financialMeaning: "EXPENSE",
      isEligibleExpense: true,
      category: "SUBSCRIPTION",
      spendingTier: "GOOD_TO_HAVE",
      tags: ["subscription", "cloud"],
    },
  },
  {
    id: "SUB-009",
    description: "OPENAI CHATGPT PLUS SUBSCRIPTION",
    amount: 1999.0,
    direction: "DEBIT",
    date: "2026-10-11",
    expected: {
      financialMeaning: "EXPENSE",
      isEligibleExpense: true,
      category: "SUBSCRIPTION",
      spendingTier: "GOOD_TO_HAVE",
      tags: ["subscription", "software", "ai"],
    },
  },
  {
    id: "SUB-010",
    description: "THE HINDU DIGITAL NEWSPAPER SUB",
    amount: 299.0,
    direction: "DEBIT",
    date: "2026-10-12",
    expected: {
      financialMeaning: "EXPENSE",
      isEligibleExpense: true,
      category: "SUBSCRIPTION",
      spendingTier: "GOOD_TO_HAVE",
      tags: ["subscription", "news"],
    },
  },

  // =========================================================================
  // 26. EXPANDED BENCHMARK: GIFT (Flowers, Charity, Gift vouchers)
  // =========================================================================
  {
    id: "GFT-003",
    description: "FERNS N PETALS ANNIVERSARY FLOWERS",
    amount: 1250.0,
    direction: "DEBIT",
    date: "2026-10-10",
    expected: {
      financialMeaning: "EXPENSE",
      isEligibleExpense: true,
      category: "GIFT",
      spendingTier: "GOOD_TO_HAVE",
      tags: ["gift", "flowers", "celebration"],
    },
  },
  {
    id: "GFT-004",
    description: "CRY CHILD RELIEF AND YOU DONATION",
    amount: 2500.0,
    direction: "DEBIT",
    date: "2026-10-11",
    expected: {
      financialMeaning: "EXPENSE",
      isEligibleExpense: true,
      category: "GIFT",
      spendingTier: "GOOD_TO_HAVE",
      tags: ["gift", "charity", "donation"],
    },
  },
  {
    id: "GFT-005",
    description: "AMAZON GIFT CARD PURCHASE 5000",
    amount: 5000.0,
    direction: "DEBIT",
    date: "2026-10-12",
    expected: {
      financialMeaning: "EXPENSE",
      isEligibleExpense: true,
      category: "GIFT",
      spendingTier: "GOOD_TO_HAVE",
      tags: ["gift", "voucher"],
    },
  },

  // =========================================================================
  // 27. EXPANDED BENCHMARK: OTHER (Explicit miscellaneous known valid expenses)
  // =========================================================================
  {
    id: "OTH-006",
    description: "ADVOCATE LEGAL CONSULTATION FEES",
    amount: 5000.0,
    direction: "DEBIT",
    date: "2026-10-10",
    expected: {
      financialMeaning: "EXPENSE",
      isEligibleExpense: true,
      category: "OTHER",
      spendingTier: "ESSENTIAL",
      tags: ["legal", "professional"],
    },
  },
  {
    id: "OTH-007",
    description: "NOTARY PUBLIC STAMP ATTESTATION CHARGES",
    amount: 350.0,
    direction: "DEBIT",
    date: "2026-10-10",
    expected: {
      financialMeaning: "EXPENSE",
      isEligibleExpense: true,
      category: "OTHER",
      spendingTier: "ESSENTIAL",
      tags: ["legal", "notary"],
    },
  },
  {
    id: "OTH-008",
    description: "GOVERNMENT NON-JUDICIAL STAMP PAPER FEE",
    amount: 500.0,
    direction: "DEBIT",
    date: "2026-10-11",
    expected: {
      financialMeaning: "EXPENSE",
      isEligibleExpense: true,
      category: "OTHER",
      spendingTier: "ESSENTIAL",
      tags: ["government", "stamp"],
    },
  },
  {
    id: "OTH-009",
    description: "REGIONAL PASSPORT OFFICE SEVA KENDRA FEE",
    amount: 1500.0,
    direction: "DEBIT",
    date: "2026-10-11",
    expected: {
      financialMeaning: "EXPENSE",
      isEligibleExpense: true,
      category: "OTHER",
      spendingTier: "ESSENTIAL",
      tags: ["government", "passport"],
    },
  },
  {
    id: "OTH-010",
    description: "CITY LOCKSMITH EMERGENCY DOOR UNLOCK",
    amount: 800.0,
    direction: "DEBIT",
    date: "2026-10-12",
    expected: {
      financialMeaning: "EXPENSE",
      isEligibleExpense: true,
      category: "OTHER",
      spendingTier: "ESSENTIAL",
      tags: ["services", "repair"],
    },
  },
  {
    id: "OTH-011",
    description: "MUNICIPAL TRADE LICENSE RENEWAL FEE",
    amount: 2500.0,
    direction: "DEBIT",
    date: "2026-10-12",
    expected: {
      financialMeaning: "EXPENSE",
      isEligibleExpense: true,
      category: "OTHER",
      spendingTier: "ESSENTIAL",
      tags: ["government", "license"],
    },
  },

  // =========================================================================
  // 28. EXPANDED BENCHMARK: INCOME (Credits, Dividends, Freelance, Salary)
  // =========================================================================
  {
    id: "INC-006",
    description: "NEFT CR-INFOSYS LTD-SALARY-OCT2026",
    amount: 95000.0,
    direction: "CREDIT",
    date: "2026-10-01",
    expected: {
      financialMeaning: "INCOME",
      isEligibleExpense: false,
      category: "OTHER",
      spendingTier: "UNCLASSIFIED",
      tags: ["salary", "income"],
    },
  },
  {
    id: "INC-007",
    description: "INTEREST CREDITED Q2 SAVINGS BANK",
    amount: 1250.0,
    direction: "CREDIT",
    date: "2026-10-05",
    expected: {
      financialMeaning: "INCOME",
      isEligibleExpense: false,
      category: "OTHER",
      spendingTier: "UNCLASSIFIED",
      tags: ["interest", "income"],
    },
  },
  {
    id: "INC-008",
    description: "CLIENT PAYMENT FREELANCE CONSULTING",
    amount: 45000.0,
    direction: "CREDIT",
    date: "2026-10-08",
    expected: {
      financialMeaning: "INCOME",
      isEligibleExpense: false,
      category: "OTHER",
      spendingTier: "UNCLASSIFIED",
      tags: ["income", "freelance"],
    },
  },

  // =========================================================================
  // 29. EXPANDED BENCHMARK: TRANSFER (FD, RD, SIP, PPF, Reversals, Refunds)
  // =========================================================================
  {
    id: "TRF-005",
    description: "AUTO SWEEP TRF TO FIXED DEPOSIT A/C",
    amount: 50000.0,
    direction: "DEBIT",
    date: "2026-10-02",
    expected: {
      financialMeaning: "TRANSFER",
      isEligibleExpense: false,
      category: "OTHER",
      spendingTier: "UNCLASSIFIED",
      tags: ["transfer", "savings"],
    },
  },
  {
    id: "TRF-006",
    description: "SWEEP TRANSFER FROM FD TO SAVINGS A/C",
    amount: 25000.0,
    direction: "CREDIT",
    date: "2026-10-03",
    expected: {
      financialMeaning: "TRANSFER",
      isEligibleExpense: false,
      category: "OTHER",
      spendingTier: "UNCLASSIFIED",
      tags: ["transfer", "savings"],
    },
  },
  {
    id: "TRF-007",
    description: "RD INSTALMENT DEBIT RECURRING DEPOSIT",
    amount: 5000.0,
    direction: "DEBIT",
    date: "2026-10-05",
    expected: {
      financialMeaning: "TRANSFER",
      isEligibleExpense: false,
      category: "OTHER",
      spendingTier: "UNCLASSIFIED",
      tags: ["transfer", "savings"],
    },
  },
  {
    id: "TRF-008",
    description: "SIP-KOTAK MUTUAL FUND INVESTMENT",
    amount: 7500.0,
    direction: "DEBIT",
    date: "2026-10-06",
    expected: {
      financialMeaning: "TRANSFER",
      isEligibleExpense: false,
      category: "OTHER",
      spendingTier: "UNCLASSIFIED",
      tags: ["transfer", "savings"],
    },
  },
  {
    id: "TRF-009",
    description: "IMPS OUTWARD TO OWN ACCOUNT HDFC",
    amount: 15000.0,
    direction: "DEBIT",
    date: "2026-10-07",
    expected: {
      financialMeaning: "TRANSFER",
      isEligibleExpense: false,
      category: "OTHER",
      spendingTier: "UNCLASSIFIED",
      tags: ["transfer"],
    },
  },
  {
    id: "TRF-010",
    description: "TRANSFER TO PPF ACCOUNT OCT CONTRIB",
    amount: 10000.0,
    direction: "DEBIT",
    date: "2026-10-08",
    expected: {
      financialMeaning: "TRANSFER",
      isEligibleExpense: false,
      category: "OTHER",
      spendingTier: "UNCLASSIFIED",
      tags: ["transfer", "savings"],
    },
  },
  {
    id: "TRF-011",
    description: "REFUND PROCESSED FLIPKART RETURNS",
    amount: 1899.0,
    direction: "CREDIT",
    date: "2026-10-09",
    expected: {
      financialMeaning: "TRANSFER",
      isEligibleExpense: false,
      category: "SHOPPING",
      spendingTier: "UNCLASSIFIED",
      tags: ["refund"],
    },
  },
  {
    id: "TRF-012",
    description: "CASHBACK CREDITED CRED UPI PAY",
    amount: 50.0,
    direction: "CREDIT",
    date: "2026-10-10",
    expected: {
      financialMeaning: "TRANSFER",
      isEligibleExpense: false,
      category: "OTHER",
      spendingTier: "UNCLASSIFIED",
      tags: ["refund"],
    },
  },
  {
    id: "TRF-013",
    description: "REVERSAL OF FAILED ATM TXN CREDIT",
    amount: 2000.0,
    direction: "CREDIT",
    date: "2026-10-11",
    expected: {
      financialMeaning: "TRANSFER",
      isEligibleExpense: false,
      category: "OTHER",
      spendingTier: "UNCLASSIFIED",
      tags: ["refund"],
    },
  },

  // =========================================================================
  // 30. EXPANDED BENCHMARK: BALANCE_SUMMARY (Summary & Header Rows)
  // =========================================================================
  {
    id: "BAL-003",
    description: "CURRENT AVAILABLE BALANCE AS ON DATE",
    amount: 52410.5,
    direction: "CREDIT",
    date: "2026-10-12",
    expected: {
      financialMeaning: "BALANCE_SUMMARY",
      isEligibleExpense: false,
      category: "OTHER",
      spendingTier: "UNCLASSIFIED",
      tags: ["balance", "statement"],
    },
  },
  {
    id: "BAL-004",
    description: "TOTAL STATEMENT SUMMARY DEBITS 48500",
    amount: 48500.0,
    direction: "DEBIT",
    date: "2026-10-12",
    expected: {
      financialMeaning: "BALANCE_SUMMARY",
      isEligibleExpense: false,
      category: "OTHER",
      spendingTier: "UNCLASSIFIED",
      tags: ["balance", "statement"],
    },
  },
  {
    id: "BAL-005",
    description: "LEDGER BALANCE CARRIED FORWARD",
    amount: 39800.0,
    direction: "CREDIT",
    date: "2026-10-12",
    expected: {
      financialMeaning: "BALANCE_SUMMARY",
      isEligibleExpense: false,
      category: "OTHER",
      spendingTier: "UNCLASSIFIED",
      tags: ["balance", "statement"],
    },
  },

  // =========================================================================
  // 31. EXPANDED BENCHMARK: AMBIGUOUS & UNKNOWN (Review / Abstention Cases)
  // =========================================================================
  {
    id: "AMB-005",
    description: "VNDR-829104-MKT-X9",
    amount: 720.0,
    direction: "DEBIT",
    date: "2026-10-11",
    expected: {
      financialMeaning: "EXPENSE",
      isEligibleExpense: true,
      category: "OTHER",
      spendingTier: "UNCLASSIFIED",
      tags: [],
      isAmbiguous: true,
      ambiguityReason: "Opaque merchant code without any readable business semantic hint.",
    },
  },
  {
    id: "AMB-006",
    description: "TXN981029481028401",
    amount: 450.0,
    direction: "DEBIT",
    date: "2026-10-11",
    expected: {
      financialMeaning: "EXPENSE",
      isEligibleExpense: true,
      category: "OTHER",
      spendingTier: "UNCLASSIFIED",
      tags: [],
      isAmbiguous: true,
      ambiguityReason: "Transaction ID only, lacking descriptive merchant text.",
    },
  },
  {
    id: "AMB-007",
    description: "MISC DEBIT REF 491028",
    amount: 300.0,
    direction: "DEBIT",
    date: "2026-10-12",
    expected: {
      financialMeaning: "EXPENSE",
      isEligibleExpense: true,
      category: "OTHER",
      spendingTier: "UNCLASSIFIED",
      tags: [],
      isAmbiguous: true,
      ambiguityReason: "Generic reference without category or merchant hints.",
    },
  },
  {
    id: "AMB-008",
    description: "GLOBAL TECH VENTURES BLR",
    amount: 3200.0,
    direction: "DEBIT",
    date: "2026-10-12",
    expected: {
      financialMeaning: "EXPENSE",
      isEligibleExpense: true,
      category: "OTHER",
      spendingTier: "UNCLASSIFIED",
      tags: [],
      isAmbiguous: true,
      ambiguityReason: "Corporate holding name without clear transaction intent.",
    },
  },
  {
    id: "AMB-009",
    description: "RECURRING PAYMENT SI-829104",
    amount: 999.0,
    direction: "DEBIT",
    date: "2026-10-12",
    expected: {
      financialMeaning: "EXPENSE",
      isEligibleExpense: true,
      category: "OTHER",
      spendingTier: "UNCLASSIFIED",
      tags: [],
      isAmbiguous: true,
      ambiguityReason: "Standing instruction ID without identifiable service or product.",
    },
  },

  // =========================================================================
  // 32. EXPANDED BENCHMARK: INVALID ROWS (Whitespace, Negative Amount)
  // =========================================================================
  {
    id: "INV-003",
    description: "   ",
    amount: 250.0,
    direction: "DEBIT",
    date: "2026-10-12",
    expected: {
      financialMeaning: "INVALID",
      isEligibleExpense: false,
      category: "OTHER",
      spendingTier: "UNCLASSIFIED",
      tags: [],
      isAmbiguous: true,
      ambiguityReason: "Whitespace-only narration cannot be classified.",
    },
  },
  {
    id: "INV-004",
    description: "NEGATIVE AMOUNT REVERSAL TEST",
    amount: -150.0,
    direction: "DEBIT",
    date: "2026-10-12",
    expected: {
      financialMeaning: "INVALID",
      isEligibleExpense: false,
      category: "OTHER",
      spendingTier: "UNCLASSIFIED",
      tags: [],
      isAmbiguous: true,
      ambiguityReason: "Negative transaction amount is invalid in canonical ledger.",
    },
  },

  // =========================================================================
  // 33. USER CORRECTIONS PRESERVATION (Reimport Regression Cases)
  // =========================================================================
  {
    id: "USR-001",
    description: "AMAZON PAY INDIA PRIVATE LIMITED",
    amount: 2500.0,
    direction: "DEBIT",
    date: "2026-10-10",
    userConfirmed: true,
    existingCategory: "GIFT",
    existingPriority: "GOOD_TO_HAVE",
    existingTags: ["birthday-gift"],
    expected: {
      financialMeaning: "EXPENSE",
      isEligibleExpense: true,
      category: "GIFT",
      spendingTier: "GOOD_TO_HAVE",
      tags: ["birthday-gift"],
      userConfirmed: true,
    },
  },
  {
    id: "USR-002",
    description: "SWIGGY BANGALORE ORDER",
    amount: 1850.0,
    direction: "DEBIT",
    date: "2026-10-11",
    userConfirmed: true,
    existingCategory: "OTHER",
    existingPriority: "ESSENTIAL",
    existingTags: ["team-lunch-reimbursable"],
    expected: {
      financialMeaning: "EXPENSE",
      isEligibleExpense: true,
      category: "OTHER",
      spendingTier: "ESSENTIAL",
      tags: ["team-lunch-reimbursable"],
      userConfirmed: true,
    },
  },
  {
    id: "USR-003",
    description: "VNDR-UNKNOWN-98214",
    amount: 4500.0,
    direction: "DEBIT",
    date: "2026-10-12",
    userConfirmed: true,
    existingCategory: "SHOPPING",
    existingPriority: "LUXURY",
    existingTags: ["vintage-collectible"],
    expected: {
      financialMeaning: "EXPENSE",
      isEligibleExpense: true,
      category: "SHOPPING",
      spendingTier: "LUXURY",
      tags: ["vintage-collectible"],
      userConfirmed: true,
    },
  },
];

/**
 * Validates the evaluation dataset against schemas and integrity constraints.
 */
export function validateEvaluationDataset(fixtures: EvaluationFixture[]): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  const seenIds = new Set<string>();

  if (!fixtures || fixtures.length === 0) {
    errors.push("Dataset must contain at least one fixture.");
    return { valid: false, errors };
  }

  for (let i = 0; i < fixtures.length; i++) {
    const f = fixtures[i];
    const prefix = `Fixture #${i} [id=${f.id || "MISSING"}]`;

    if (!f.id || typeof f.id !== "string" || f.id.trim() === "") {
      errors.push(`${prefix}: Missing or empty fixture ID.`);
    } else if (seenIds.has(f.id)) {
      errors.push(`${prefix}: Duplicate fixture ID "${f.id}".`);
    } else {
      seenIds.add(f.id);
    }

    if (typeof f.amount !== "number" || isNaN(f.amount)) {
      errors.push(`${prefix}: Invalid amount (${f.amount}).`);
    }

    if (f.direction !== "DEBIT" && f.direction !== "CREDIT") {
      errors.push(`${prefix}: Invalid direction "${f.direction}". Must be DEBIT or CREDIT.`);
    }

    if (!f.expected) {
      errors.push(`${prefix}: Missing expected label object.`);
      continue;
    }

    const validMeanings: readonly string[] = [...EVALUATION_FINANCIAL_MEANINGS, "BALANCE_ROW"];
    if (!validMeanings.includes(f.expected.financialMeaning)) {
      errors.push(
        `${prefix}: Invalid financialMeaning "${f.expected.financialMeaning}". Allowed: ${EVALUATION_FINANCIAL_MEANINGS.join(
          ", "
        )}`
      );
    }

    if (typeof f.expected.isEligibleExpense !== "boolean") {
      errors.push(`${prefix}: isEligibleExpense must be a boolean.`);
    }

    if (!EVALUATION_CATEGORIES.includes(f.expected.category)) {
      errors.push(
        `${prefix}: Invalid expected category "${f.expected.category}". Allowed: ${EVALUATION_CATEGORIES.join(
          ", "
        )}`
      );
    }

    if (!EVALUATION_SPENDING_TIERS.includes(f.expected.spendingTier)) {
      errors.push(
        `${prefix}: Invalid expected spendingTier "${f.expected.spendingTier}". Allowed: ${EVALUATION_SPENDING_TIERS.join(
          ", "
        )}`
      );
    }

    if (f.expected.tags && !Array.isArray(f.expected.tags)) {
      errors.push(`${prefix}: tags must be an array of strings.`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
