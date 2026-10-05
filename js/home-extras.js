// =============================================
// HOME EXTRAS — Testimonials, FAQ, Blog
// =============================================

/* ---- TESTIMONIALS (100 cards, infinite scroll) ---- */
const DEMO_TESTIMONIALS = [
  { text: "The purity and consistency of Labsourced peptides have significantly improved the reliability of our ongoing research studies. Exceptional quality.", author: "Dr. James M.", role: "Clinical Researcher" },
  { text: "Shipping was remarkably fast, and the packaging reflects their premium standards. BPC-157 yielded perfect analytical results.", author: "Sarah T.", role: "Lead Scientist" },
  { text: "As a biotechnology facility, we require absolute precision. Labsourced provides the transparency and documentation we need for compliance.", author: "Michael R.", role: "Lab Director" },
  { text: "Our lab has been sourcing peptides from Labsourced for over two years. The Certificate of Analysis with each order is invaluable for our regulatory submissions.", author: "Dr. Linda K.", role: "Principal Investigator" },
  { text: "Unmatched customer service and product quality. Our TB-500 studies have never been more consistent since switching to Labsourced.", author: "Prof. Alan W.", role: "University Researcher" },
  { text: "The HPLC testing documentation provided with every batch gives us complete confidence. A truly professional supplier.", author: "Dr. Priya S.", role: "Biochemist" },
  { text: "Prompt delivery, excellent packaging, and pharmaceutical-grade purity. Labsourced has become our go-to supplier for all research peptides.", author: "Thomas H.", role: "Research Pharmacologist" },
  { text: "CJC-1295 results have been outstanding — consistent batch after batch. I recommend Labsourced to every colleague in my department.", author: "Dr. Elena V.", role: "Endocrinologist" },
  { text: "The online ordering process is seamless and professional. Products arrive exactly as described, with full documentation.", author: "James P.", role: "Laboratory Manager" },
  { text: "We've conducted multiple studies using Labsourced Ipamorelin. Results are reproducible and reliable — exactly what research demands.", author: "Dr. Chen L.", role: "Clinical Research Director" },
  { text: "Exceptional purity verified independently. Labsourced is setting the standard for research-grade peptide suppliers.", author: "Dr. Maria G.", role: "Biotechnology Specialist" },
  { text: "The Tirzepatide we received was flawless — matched the COA perfectly. We will continue ordering exclusively from Labsourced.", author: "Prof. Robert S.", role: "Metabolic Research Lead" },
  { text: "I appreciate the consistent communication and tracking updates. A company that values its professional clients.", author: "Dr. Hannah B.", role: "Pharmaceutical Researcher" },
  { text: "Switching to Labsourced improved our research output significantly. The product quality speaks for itself.", author: "Dr. Marcus T.", role: "Neuroscience Researcher" },
  { text: "Outstanding product quality and professional customer service. Labsourced is now the only supplier we trust for critical research.", author: "Susan L.", role: "Research Scientist" },
  { text: "Fast international shipping with excellent cold-chain packaging. Our peptides arrived in perfect condition.", author: "Dr. Patrick N.", role: "Sports Medicine Researcher" },
  { text: "We have been impressed by the consistency and accuracy of each product. Our studies depend on it, and Labsourced delivers every time.", author: "Dr. Yuki M.", role: "Molecular Biologist" },
  { text: "The research documentation provided is thorough and professional. Makes regulatory compliance straightforward.", author: "Dr. Anna K.", role: "Regulatory Affairs Specialist" },
  { text: "BPC-157 from Labsourced has been instrumental in our tissue research. Impeccable quality, delivered on time.", author: "Dr. Carlos R.", role: "Tissue Engineering Researcher" },
  { text: "We tested their Semaglutide against three other suppliers. Labsourced outperformed all competitors on purity and consistency.", author: "Prof. Diana F.", role: "Endocrine Research Professor" },
  { text: "Reordering is simple and quick. The repeat order process is as smooth as the first purchase. Highly professional.", author: "Dr. Nathan W.", role: "Lab Operations Manager" },
  { text: "Our entire research team is impressed with Labsourced. We will be placing a large repeat order for our new study.", author: "Dr. Fatima A.", role: "Biomedical Research Head" },
  { text: "The peptide quality is consistently excellent. Our data is more reproducible than ever since we made the switch.", author: "Dr. George T.", role: "Cell Biology Researcher" },
  { text: "We appreciate how Labsourced handles every order with professionalism. The COA matches our in-house testing exactly.", author: "Prof. Ingrid S.", role: "Pharmaceutical Sciences" },
  { text: "The Ipamorelin studies have exceeded our expectations. Labsourced's quality control is clearly world-class.", author: "Dr. Kevin O.", role: "Clinical Trial Coordinator" },
  { text: "Every batch we have received has been pure and consistent. Cannot recommend Labsourced highly enough to fellow researchers.", author: "Dr. Layla H.", role: "Peptide Chemistry Specialist" },
  { text: "Professional from first contact to delivery. The team is responsive and knowledgeable about their products.", author: "Mark J.", role: "Research Procurement Officer" },
  { text: "Labsourced is the benchmark for peptide suppliers in our field. Their commitment to quality is evident in every product.", author: "Dr. Nadia V.", role: "Immunology Researcher" },
  { text: "We have used TB-500 for our wound healing studies for three years. Labsourced quality makes our results publishable.", author: "Dr. Oliver B.", role: "Regenerative Medicine Scientist" },
  { text: "The new online portal makes ordering fast and tracking easy. A genuinely professional experience.", author: "Dr. Paula C.", role: "Senior Research Fellow" },
  { text: "Our animal studies have shown consistent results thanks to the reliable quality of Labsourced peptides.", author: "Prof. Quinn M.", role: "Veterinary Research Scientist" },
  { text: "International delivery was faster than expected and the packaging exceeded our biosafety requirements.", author: "Dr. Rosa L.", role: "International Research Coordinator" },
  { text: "We've built our entire peptide research program around Labsourced. The reliability is something we cannot compromise on.", author: "Dr. Stefan K.", role: "Research Program Director" },
  { text: "Labsourced's Semaglutide has been the backbone of our metabolic study. Consistent, pure, and professionally documented.", author: "Dr. Tanya N.", role: "Metabolic Disease Researcher" },
  { text: "The quality assurance process is transparent and thorough. We always know exactly what we are receiving.", author: "Dr. Ulrich F.", role: "Quality Assurance Scientist" },
  { text: "We tested every batch independently and Labsourced has never fallen short of the stated purity. Remarkable consistency.", author: "Prof. Vera D.", role: "Analytical Chemistry Professor" },
  { text: "From inquiry to delivery, every interaction with Labsourced has been professional, efficient, and trustworthy.", author: "Dr. William H.", role: "Lead Pharmacologist" },
  { text: "The packaging is excellent and the courier updates are very helpful. A supplier that understands research logistics.", author: "Dr. Xiomara P.", role: "Clinical Research Nurse" },
  { text: "Labsourced has earned our full trust. Every order we have placed has arrived perfectly and passed all our in-house checks.", author: "Dr. Yolanda S.", role: "Bioassay Scientist" },
  { text: "Their CJC-1295 has been foundational to our growth hormone research. We could not do this work without Labsourced.", author: "Dr. Zachary N.", role: "Hormone Research Specialist" },
  { text: "As a small research institute, we appreciate Labsourced's ability to handle both small and large orders with equal professionalism.", author: "Dr. Alice M.", role: "Institute Research Director" },
  { text: "We have never received a product that failed our quality checks. Labsourced is simply the best peptide supplier we have worked with.", author: "Dr. Brian O.", role: "Biochemical Analyst" },
  { text: "Our multi-year collaboration with Labsourced has produced consistently excellent research outcomes. They are a true research partner.", author: "Prof. Claire T.", role: "Research Collaboration Lead" },
  { text: "Every scientist in our department has praised the quality of Labsourced peptides. A well-earned reputation.", author: "Dr. David L.", role: "Department Research Head" },
  { text: "Professional, reliable, and genuinely committed to supporting research. Labsourced stands apart from other suppliers.", author: "Dr. Emma R.", role: "Translational Medicine Researcher" },
  { text: "The customer support team answered all our technical questions promptly and accurately. Excellent service.", author: "Dr. Felix S.", role: "Research Support Scientist" },
  { text: "Labsourced has made a significant positive impact on our research timelines. Their reliability is exceptional.", author: "Dr. Grace W.", role: "Biomedical Project Manager" },
  { text: "We trust Labsourced completely for our peptide sourcing. The COA documentation is always accurate and detailed.", author: "Dr. Henry B.", role: "Research Compliance Officer" },
  { text: "The Ipamorelin we received exceeded our purity requirements. Our in vivo studies have shown exceptional results.", author: "Dr. Isabelle F.", role: "In Vivo Research Scientist" },
  { text: "We have recommended Labsourced to three partner universities. All of them have had excellent experiences.", author: "Prof. Julian K.", role: "University Research Liaison" },
  { text: "The online account system makes it easy to track all past orders and download COA documents. Very well designed.", author: "Dr. Katherine A.", role: "Laboratory Information Manager" },
  { text: "We use Labsourced for all our peptide needs. The consistency across batches is something we have come to rely on completely.", author: "Dr. Liam C.", role: "Peptide Research Specialist" },
  { text: "Every aspect of the purchasing experience is professional. From website to delivery — outstanding.", author: "Dr. Mia T.", role: "Research Procurement Director" },
  { text: "Our in vitro data using Labsourced BPC-157 has been of publication quality from day one.", author: "Dr. Noah B.", role: "In Vitro Research Lead" },
  { text: "Labsourced supports our research by providing reliable, high-purity compounds. They are an invaluable supplier.", author: "Prof. Olivia D.", role: "Research Chemistry Professor" },
  { text: "The TB-500 we ordered arrived in 48 hours. Packaging was flawless. We are extremely satisfied.", author: "Dr. Peter F.", role: "Sports Science Researcher" },
  { text: "We use the COA provided by Labsourced in our regulatory submissions. The accuracy and detail are exactly what regulators require.", author: "Dr. Quinn L.", role: "Regulatory Research Scientist" },
  { text: "The level of professionalism from Labsourced matches what we expect from a pharmaceutical-grade supplier.", author: "Dr. Rachel N.", role: "Pharmaceutical Development Researcher" },
  { text: "Our entire team was impressed when we first switched to Labsourced. Three years later, that impression has only strengthened.", author: "Dr. Samuel T.", role: "Team Research Coordinator" },
  { text: "Labsourced's ability to ship internationally while maintaining cold-chain integrity is genuinely impressive.", author: "Dr. Tina M.", role: "International Research Collaborator" },
  { text: "We have never experienced a quality issue with any Labsourced product. Consistent, pure, and professional.", author: "Dr. Usman A.", role: "Quality Research Scientist" },
  { text: "The Semaglutide studies we have conducted using Labsourced compounds have all yielded consistent, high-quality data.", author: "Prof. Victoria S.", role: "Clinical Study Lead" },
  { text: "Ordering is simple, delivery is fast, and quality is flawless. Labsourced ticks every box for our research facility.", author: "Dr. Walter K.", role: "Facility Research Manager" },
  { text: "We are impressed by the detail in the Labsourced product documentation. It significantly reduces our pre-study preparation time.", author: "Dr. Xenia B.", role: "Research Preparation Scientist" },
  { text: "Labsourced delivers exactly what they promise. In research, that level of reliability is priceless.", author: "Dr. Yasmin O.", role: "Research Reliability Specialist" },
  { text: "Our CJC-1295 peptide research has flourished since we partnered with Labsourced. We are truly grateful for their quality.", author: "Dr. Zara F.", role: "Growth Research Scientist" },
  { text: "Professional communication throughout the ordering process. Questions answered promptly by knowledgeable staff.", author: "Dr. Aaron C.", role: "Research Communication Lead" },
  { text: "We appreciate the complete transparency Labsourced provides. It is exactly what research ethics demands of a supplier.", author: "Prof. Bella T.", role: "Research Ethics Advisor" },
  { text: "The quality of Labsourced's Tirzepatide is consistently superior. Our metabolic research team depends on it.", author: "Dr. Cameron N.", role: "Metabolic Research Scientist" },
  { text: "We have verified every batch independently. Labsourced consistently matches or exceeds stated specifications.", author: "Dr. Daisy L.", role: "Independent Verification Scientist" },
  { text: "Our facility handles sensitive research. Labsourced's documentation and purity standards make them our only choice.", author: "Dr. Eliot S.", role: "Sensitive Research Director" },
  { text: "We have expanded our research program specifically because we know Labsourced can supply consistent quality at scale.", author: "Prof. Flora M.", role: "Research Expansion Lead" },
  { text: "The Ipamorelin results in our latest study were exceptional. Labsourced's product quality made the difference.", author: "Dr. Grant T.", role: "Research Outcomes Analyst" },
  { text: "Customer support went above and beyond when we needed help with an urgent order. Outstanding service.", author: "Dr. Holly K.", role: "Research Operations Scientist" },
  { text: "We have placed over 50 orders with Labsourced. Every single one has arrived on time and to specification.", author: "Dr. Ivan B.", role: "Repeat Research Client" },
  { text: "The packaging design communicates the quality of what is inside. A professional product presentation.", author: "Dr. Jade R.", role: "Research Packaging Analyst" },
  { text: "Labsourced has become our institution's preferred supplier. The quality assurance process is simply the best we have encountered.", author: "Prof. Karl D.", role: "Institutional Research Supplier Manager" },
  { text: "We run a high-throughput research facility. Labsourced's ability to handle large orders without quality compromise is remarkable.", author: "Dr. Lydia M.", role: "High-Throughput Research Director" },
  { text: "Our animal model studies using Labsourced peptides have produced results that are directly informing human clinical trials.", author: "Dr. Martin G.", role: "Translational Research Scientist" },
  { text: "The combination of product quality and professional service makes Labsourced the clear leader in the research peptide space.", author: "Dr. Nina O.", role: "Research Industry Analyst" },
  { text: "Our research institute has a strict supplier approval process. Labsourced passed every criterion with the highest marks.", author: "Dr. Oscar T.", role: "Supplier Approval Scientist" },
  { text: "The COA provided with each order allows our quality team to approve products immediately without additional testing delays.", author: "Dr. Paula K.", role: "Quality Assurance Team Lead" },
  { text: "We extended our research partnership with Labsourced after reviewing our data. The quality speaks for itself.", author: "Prof. Quincy S.", role: "Research Partnership Director" },
  { text: "Our regulatory team specifically requested we use Labsourced for our clinical study supplies. A supplier regulators trust.", author: "Dr. Ruby F.", role: "Clinical Supply Specialist" },
  { text: "The entire supply chain experience with Labsourced is seamless. Ordering, communication, tracking, delivery — all excellent.", author: "Dr. Sebastian L.", role: "Supply Chain Research Manager" },
  { text: "We have used Labsourced for five distinct research projects. Each one has benefited from their consistent product quality.", author: "Dr. Tara N.", role: "Multi-Project Research Lead" },
  { text: "Labsourced's commitment to documentation transparency has made our grant reporting significantly easier.", author: "Dr. Uma B.", role: "Research Grant Officer" },
  { text: "We are confident recommending Labsourced to any serious research facility. Their standards are genuinely world-class.", author: "Prof. Vincent M.", role: "Research Standards Authority" },
  { text: "Our independent lab tests confirm everything on the COA. Zero discrepancies across 30+ orders. Impressive.", author: "Dr. Wendy A.", role: "Independent Lab Testing Scientist" },
  { text: "The Labsourced website is professional and ordering is intuitive. We appreciate a supplier that invests in their client experience.", author: "Dr. Xavier K.", role: "Research Client Experience Advisor" },
  { text: "Our BPC-157 tissue research has produced publishable results directly attributable to the quality of Labsourced's product.", author: "Dr. Yvonne T.", role: "Tissue Research Scientist" },
  { text: "We have been thoroughly impressed by every aspect of our experience with Labsourced. A truly professional research supplier.", author: "Dr. Zachary O.", role: "Research Excellence Director" },
  { text: "The consistency of Labsourced products across different batches is something we have come to depend on completely.", author: "Dr. Amara C.", role: "Batch Consistency Analyst" },
  { text: "Our institution awarded Labsourced our highest supplier rating. They have truly earned it through consistent quality.", author: "Prof. Benjamin S.", role: "Institutional Supplier Evaluator" },
  { text: "Three years, multiple products, and never a single quality complaint. Labsourced is simply the best.", author: "Dr. Celeste T.", role: "Long-Term Research Partner" },
  { text: "We trust Labsourced with our most critical research compounds. That trust has been earned through consistent excellence.", author: "Dr. Dennis W.", role: "Critical Research Scientist" },
  { text: "The customer experience from Labsourced is as premium as the products themselves. A complete package.", author: "Dr. Elena F.", role: "Research Experience Specialist" }
];

function buildTestimonials() {
  const track = document.getElementById('testiTrack');
  if (!track) return;
  // Duplicate for seamless infinite loop
  const all = [...DEMO_TESTIMONIALS, ...DEMO_TESTIMONIALS];
  track.innerHTML = all.map(t => `
    <div class="testi-card">
      <div class="testi-stars">★★★★★</div>
      <p class="testi-text">"${t.text}"</p>
      <p class="testi-author">— ${t.author}</p>
      <p class="testi-role">${t.role}</p>
    </div>`).join('');
}

/* ---- FAQ ---- */
const DEFAULT_FAQS = [
  { q: "What are research peptides?", a: "Research peptides are short chains of amino acids used exclusively for scientific and laboratory research. They are not intended for human or veterinary use and are sold strictly for in vitro and in vivo research applications." },
  { q: "Are your peptides tested for purity?", a: "Yes. Every batch undergoes rigorous third-party HPLC testing and mass spectrometry analysis. A Certificate of Analysis (COA) is provided with every order, confirming purity, composition, and batch number." },
  { q: "What is the minimum purity level of your peptides?", a: "All Labsourced peptides carry a minimum purity of 98% as verified by HPLC analysis. Most batches achieve 99%+ purity. The exact figure is documented on your Certificate of Analysis." },
  { q: "How are products shipped?", a: "All orders are shipped in temperature-controlled packaging to maintain peptide stability during transit. We offer express international shipping with full tracking and discreet, professional packaging." },
  { q: "How long does shipping take?", a: "Domestic orders typically arrive within 2–4 business days. International orders take 5–10 business days depending on destination and customs clearance." },
  { q: "Do you ship internationally?", a: "Yes, we ship to most countries worldwide. It is the customer's responsibility to ensure that importing research chemicals is permitted in their jurisdiction. Please review your local regulations before ordering." },
  { q: "How should I store my peptides?", a: "Lyophilized (freeze-dried) peptides should be stored at -20°C or below, away from light and moisture. Once reconstituted, peptides should be refrigerated at 2–8°C and used within a reasonable timeframe." },
  { q: "What is the shelf life of your peptides?", a: "Lyophilized peptides stored properly at -20°C typically have a shelf life of 24 months or more. Reconstituted peptides should generally be used within 30 days when stored at 2–8°C." },
  { q: "Can I request a Certificate of Analysis for a specific batch?", a: "Yes. COA documents are available for every batch we sell. Contact our support team at support@labsourced.co with your order number and batch reference to request documentation." },
  { q: "Do you offer bulk or wholesale pricing?", a: "Yes. We offer competitive pricing for bulk and wholesale orders. Please contact us directly at support@labsourced.co to discuss your requirements and receive a customised quote." },
  { q: "What payment methods do you accept?", a: "We accept major credit cards, bank transfers, and other approved payment methods. All transactions are secured with industry-standard encryption for your protection." },
  { q: "What is your refund policy?", a: "We offer refunds or replacements for products that are damaged, defective, or do not match their Certificate of Analysis. Please review our full Refund Policy page for complete terms and conditions." },
  { q: "Can I track my order?", a: "Yes. A tracking number is provided via email as soon as your order is dispatched. You can also use our Track Order page on the website to check real-time delivery status." },
  { q: "Are your products suitable for human consumption?", a: "No. All Labsourced products are sold strictly for research purposes only and are not intended for human or animal consumption, therapeutic use, or any application outside of laboratory research." },
  { q: "How do I contact customer support?", a: "You can reach our support team at support@labsourced.co. We aim to respond to all inquiries within 24 business hours. For urgent matters, please include 'URGENT' in your subject line." }
];

function loadFAQs() {
  const list = document.getElementById('faqList');
  if (!list) return;
  const stored = localStorage.getItem('labsourced_faqs');
  const faqs = stored ? JSON.parse(stored) : DEFAULT_FAQS;
  list.innerHTML = faqs.map((f, i) => `
    <div class="faq-item" id="faq-${i}">
      <button class="faq-q" onclick="toggleFaq(${i})">
        <span>${f.q}</span>
        <span class="faq-icon">+</span>
      </button>
      <div class="faq-a">${f.a}</div>
    </div>`).join('');
}

function toggleFaq(index) {
  const item = document.getElementById(`faq-${index}`);
  const isOpen = item.classList.contains('open');
  document.querySelectorAll('.faq-item.open').forEach(el => el.classList.remove('open'));
  if (!isOpen) item.classList.add('open');
}
window.toggleFaq = toggleFaq;

/* ---- BLOG ---- */
const DEFAULT_BLOG_POSTS = [
  {
    id: 'b1', tag: 'Research Update', title: 'BPC-157: Mechanisms of Tissue Repair in Current Research',
    excerpt: 'A review of the latest peer-reviewed findings on BPC-157\'s role in accelerating connective tissue regeneration and its implications for sports medicine research.',
    date: 'September 2026', img: null
  },
  {
    id: 'b2', tag: 'Science Brief', title: 'Semaglutide and Metabolic Research: What the Data Shows',
    excerpt: 'Our scientific team reviews the growing body of evidence around GLP-1 receptor agonism and its role in metabolic disease research applications.',
    date: 'August 2026', img: null
  },
  {
    id: 'b3', tag: 'Lab Insight', title: 'Understanding HPLC Testing: How We Verify Peptide Purity',
    excerpt: 'An inside look at the HPLC analysis process used to verify every batch of peptides before it leaves our facility — and what to look for in a Certificate of Analysis.',
    date: 'August 2026', img: null
  },
  {
    id: 'b4', tag: 'Research Update', title: 'TB-500 and Wound Healing: A Summary of Current Evidence',
    excerpt: 'We explore the most compelling research findings on Thymosin Beta-4 and its role in promoting cellular migration, angiogenesis, and tissue recovery.',
    date: 'July 2026', img: null
  },
  {
    id: 'b5', tag: 'Science Brief', title: 'CJC-1295 and Growth Hormone Research: Key Considerations',
    excerpt: 'A scientific overview of CJC-1295\'s mechanism of action, dosing considerations in research contexts, and what current studies reveal about its applications.',
    date: 'July 2026', img: null
  },
  {
    id: 'b6', tag: 'Lab Insight', title: 'Peptide Storage Best Practices for Research Facilities',
    excerpt: 'Proper storage is critical to peptide integrity. Our team shares evidence-based guidelines for maintaining peptide stability in research laboratory environments.',
    date: 'June 2026', img: null
  }
];

function loadBlog() {
  const grid = document.getElementById('blogGrid');
  if (!grid) return;
  const stored = localStorage.getItem('labsourced_blogs');
  const posts = stored ? JSON.parse(stored) : DEFAULT_BLOG_POSTS;
  if (!posts.length) {
    grid.innerHTML = '<p style="text-align:center;color:#999;grid-column:1/-1;">No blog posts yet.</p>';
    return;
  }

  // Tag → accent colour map
  const TAG_COLORS = {
    'Research Update':  { bg: 'rgba(6,51,47,0.09)',  text: '#06332F' },
    'Science Brief':    { bg: 'rgba(200,169,106,0.15)', text: '#87651F' },
    'Lab Insight':      { bg: 'rgba(59,130,246,0.12)', text: '#1e40af' },
  };

  // Gradient overlays for placeholder cards (cycles)
  const GRADIENTS = [
    'linear-gradient(135deg, #0B3D35 0%, #06332F 50%, #071e1c 100%)',
    'linear-gradient(135deg, #1a2a2a 0%, #0d3b31 50%, #061f1c 100%)',
    'linear-gradient(135deg, #0f2a20 0%, #0b3535 50%, #07232a 100%)',
  ];

  // Compute approximate read time (words / 200 wpm)
  function readTime(text) {
    const words = (text || '').trim().split(/\s+/).length;
    return Math.max(1, Math.round(words / 200));
  }

  grid.innerHTML = posts.map((p, i) => {
    const tag = p.tag || 'Research';
    const tagStyle = TAG_COLORS[tag] || { bg: 'rgba(6,51,47,0.08)', text: '#06332F' };
    const gradient = GRADIENTS[i % GRADIENTS.length];
    const rt = readTime(p.excerpt);

    const imgHtml = p.img
      ? `<div class="blog-card-img-wrap">
           <img src="${p.img}" alt="${p.title}" class="blog-card-img" loading="lazy" onerror="this.closest('.blog-card-img-wrap').innerHTML=blogPlaceholder(${i})">
           <div class="blog-card-img-overlay"></div>
         </div>`
      : `<div class="blog-card-img-placeholder" style="background:${gradient}">
           <div class="blog-placeholder-inner">
             <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="rgba(200,169,106,0.55)" stroke-width="1.2"><path d="M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v18m0 0h10a2 2 0 0 0 2-2V9M9 21H5a2 2 0 0 1-2-2V9m0 0h18"/></svg>
             <span>${tag}</span>
           </div>
         </div>`;

    return `
    <article class="blog-card">
      ${imgHtml}
      <div class="blog-card-body">
        <div class="blog-card-meta-row">
          <span class="blog-card-tag" style="background:${tagStyle.bg};color:${tagStyle.text};">${tag}</span>
          <span class="blog-read-time">${rt} min read</span>
        </div>
        <h3 class="blog-card-title">${p.title}</h3>
        <p class="blog-card-excerpt">${p.excerpt}</p>
        <div class="blog-card-footer">
          <span class="blog-date">${p.date || ''}</span>
          <a class="blog-read-more" href="pages/blog.html">Read Article
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          </a>
        </div>

      </div>
    </article>`;
  }).join('');
}

function blogPlaceholder(i) {
  const GRADIENTS = [
    'linear-gradient(135deg, #0B3D35 0%, #06332F 50%, #071e1c 100%)',
    'linear-gradient(135deg, #1a2a2a 0%, #0d3b31 50%, #061f1c 100%)',
    'linear-gradient(135deg, #0f2a20 0%, #0b3535 50%, #07232a 100%)',
  ];
  return `<div class="blog-card-img-placeholder" style="background:${GRADIENTS[i%GRADIENTS.length]}"><div class="blog-placeholder-inner"><svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="rgba(200,169,106,0.55)" stroke-width="1.2"><path d="M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v18m0 0h10a2 2 0 0 0 2-2V9M9 21H5a2 2 0 0 1-2-2V9m0 0h18"/></svg></div></div>`;
}

/* ---- INIT ---- */
document.addEventListener('DOMContentLoaded', () => {
  buildTestimonials();
  loadFAQs();
  loadBlog();
});
