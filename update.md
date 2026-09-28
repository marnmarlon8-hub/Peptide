You are a senior full-stack software engineer.
I have an existing website called:
Labsource_Peptides_web
I want you to transform it into a complete professional ecommerce platform using my existing Supabase project:
Supabase Project: Labsource_Peptides_web
Do not create a simple frontend mockup.
Build a fully functional production-ready ecommerce system with:
- Frontend website
- Backend database integration
- Admin dashboard
- Product management
- Order management
- Customer checkout system
- Multi-language support
- Multi-currency support
Maintain the existing Labsourced premium design style.
TECH STACK REQUIREMENT
Use:
Frontend:
- Existing HTML/CSS/JavaScript structure OR modernize if required
- Responsive design
- Mobile-first
Backend:
- Supabase
Use Supabase for:
- Database
- Authentication
- Storage
- Product images
- Order data
- Admin management
PART 1 — ADMIN DASHBOARD
Create a secure admin dashboard.
Admin login required.
Create admin credentials:
Email:
admin@labsourced.com
Password:
Generate a secure temporary password and display it clearly after setup.
ADMIN DASHBOARD FEATURES
The admin dashboard must contain:
1. Product Management
Admin can:
- Add products
- Edit products
- Delete products
- Update products
- Hide/show products
Each product must contain:
Product name
Product images
Product category
Short description
Detailed description
Product specifications
Available quantities/grams
Example:
Product:
BPC-157
Options:
5mg → $50
10mg → $80
15mg → $120
The admin must be able to add unlimited variations:
- Different grams
- Different prices
- Different availability
PRODUCT DISPLAY
The shop page must automatically display products from Supabase.
When a customer clicks a product:
Open professional product page.
Display:
- Product images
- Product title
- Description
- Available grams
- Price for each gram
- Reviews
- Related products
Example:
Select:
10mg
Price changes automatically.
The "Add to Cart" button must add:
Selected product +
Selected quantity +
Correct price
PART 2 — CATEGORY MANAGEMENT
Create category management inside admin dashboard.
Admin can:
- Create categories
- Edit categories
- Delete categories
- Add category images
Examples:
Categories:
- Recovery
- Performance
- Longevity
- Research
Admin can assign products to categories.
The categories shown on the frontend must come from the database.
PART 3 — FEATURED PRODUCTS
Admin should have control over homepage products.
Add:
"Featured Product"
option.
Admin can choose:
- Products displayed on homepage
- Best sellers
- Recommended products
PART 4 — PRODUCT IMAGES
Use Supabase Storage.
Admin can upload:
- Product images
- Category images
- Website images
Images should automatically display on:
- Homepage
- Shop page
- Product page
PART 5 — CUSTOMER LANGUAGE, CURRENCY & COUNTRY SELECTION
When a customer enters the website:
Show a professional welcome selector.
Customer chooses:
Language
Add 5 languages:
1. English
2. French
3. Spanish
4. German
5. Italian
The entire website should translate:
- Navigation
- Product information
- Buttons
- Checkout
- Policies
Currency
Add:
USD ($)
EUR (€)
GBP (£)
CAD ($)
AUD ($)
Products should automatically convert prices.
Use correct currency symbols.
Shipping Country
Customer selects country.
Save preference.
Use it during checkout.
PART 6 — PRODUCT REVIEWS
Each product must have:
Professional rating system.
Display:
★★★★★
Average rating
Number of reviews
Admin dashboard controls:
- Approve reviews
- Delete reviews
- Edit reviews
- Add reviews
PART 7 — RELATED PRODUCTS
Each product page must show:
"Related Products"
Admin can manually select related products.
OR
System automatically recommends similar products.
PART 8 — LEGAL PAGES CMS
Create editable pages:
Admin controls content.
Pages:
Privacy Policy
Terms & Conditions
Shipping Policy
Refund Policy
Admin can edit text from dashboard.
PART 9 — CART SYSTEM
Customer cart must include:
Product image
Product name
Selected grams
Quantity
Price
Subtotal
Total
Automatic calculation.
PART 10 — PROFESSIONAL CHECKOUT FLOW
Create a multi-step checkout.
Do not put everything on one page.
STEP 1
Customer information:
Required:
Full name
Email
Country
City
Address
ZIP code
WhatsApp number
Phone number
STEP 2
Purchase information:
Customer must provide:
Reason for purchase
Required field.
STEP 3
Payment Method
Professional payment selection cards:
Options:
- Cash App
- Chime
- Gift Card
- Credit Card
- Bank Transfer
- Apple Pay
Customer selects one.
STEP 4
Order Confirmation
Show:
Products
Customer information
Payment method
Total amount
Submit order.
PART 11 — ORDER MANAGEMENT SYSTEM
Every order must appear inside admin dashboard.
Admin can:
View order
Update order status
Statuses:
Pending
Approved
Payment Confirmed
Processing
Shipped
At Port
Out For Delivery
Delivered
Cancelled
PART 12 — CUSTOMER ORDER TRACKING
Create order tracking page.
Customer enters:
Order tracking code
Example:
LS-20260001
Customer sees:
Order status timeline.
Example:
✓ Order Approved
✓ Payment Confirmed
✓ Processing
✓ Shipped
○ Delivered
PART 13 — ADMIN DASHBOARD SECTIONS
Create:
Dashboard Overview
Products
Categories
Orders
Customers
Reviews
Website Content
Translations
Currency Settings
Shipping Settings
PART 14 — DESIGN REQUIREMENTS
Keep Labsourced premium design.
Style:
Luxury biotechnology ecommerce.
Use:
Dark green
White
Gold accents
Clean typography
Premium cards
Smooth animations
Do not make it look like a normal ecommerce template.
PART 15 — DATABASE DESIGN
Create Supabase tables:
products
product_variations
categories
orders
order_items
customers
reviews
translations
website_pages
admin_users
shipping_settings
currency_settings
Create relationships correctly.
FINAL REQUIREMENT
The final website must be a complete ecommerce platform.
A customer should be able to:
1. Enter website
2. Select language/currency/country
3. Browse products
4. View product details
5. Select grams
6. Add to cart
7. Checkout
8. Choose payment
9. Submit order
10. Track order
The admin should be able to control everything from the dashboard.
Do not leave placeholder functionality.
Build everything professionally.