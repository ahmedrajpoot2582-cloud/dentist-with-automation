const $ = (selector, scope = document) => scope.querySelector(selector);
const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];
const bookingDialog = $('#appointment-dialog');
const contentDialog = $('#content-dialog');
const bookingForm = $('#booking-form');
let lastTrigger = null;
let preparedRequest = null;
let toastTimeout;

$('#year').textContent = new Date().getFullYear();
const localToday = new Date();
localToday.setMinutes(localToday.getMinutes() - localToday.getTimezoneOffset());
bookingForm.elements.date.min = localToday.toISOString().slice(0, 10);

function notify(message) {
  clearTimeout(toastTimeout);
  $('#toast').textContent = message;
  $('#toast').classList.add('show');
  toastTimeout = setTimeout(() => $('#toast').classList.remove('show'), 5500);
}

function openBooking(service, trigger) {
  lastTrigger = trigger || document.activeElement;
  if (contentDialog.open) contentDialog.close();
  if (service) bookingForm.elements.service.value = service;
  $('#booking-intro').hidden = false;
  $('#booking-success').hidden = true;
  if (!bookingDialog.open) bookingDialog.showModal();
  document.body.classList.add('modal-open');
  bookingDialog.scrollTop = 0;
  closeMenu();
}

$$('[data-book]').forEach(button => button.addEventListener('click', () => openBooking(null, button)));
$$('[data-service]').forEach(button => button.addEventListener('click', () => openBooking(button.dataset.service, button)));
$$('dialog').forEach(dialog => {
  $('.dialog-close', dialog).addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => {
    const box = dialog.getBoundingClientRect();
    if (event.target === dialog && (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom)) dialog.close();
  });
  dialog.addEventListener('close', () => {
    if (!$$('dialog[open]').length) {
      document.body.classList.remove('modal-open');
      lastTrigger?.focus({preventScroll: true});
    }
  });
});

const menuToggle = $('.menu-toggle');
const mobileNav = $('#mobile-nav');
function closeMenu() {
  mobileNav.hidden = true;
  menuToggle.setAttribute('aria-expanded', 'false');
  menuToggle.setAttribute('aria-label', 'Open navigation');
}
menuToggle.addEventListener('click', () => {
  const isOpening = mobileNav.hidden;
  mobileNav.hidden = !isOpening;
  menuToggle.setAttribute('aria-expanded', String(isOpening));
  menuToggle.setAttribute('aria-label', isOpening ? 'Close navigation' : 'Open navigation');
});
$$('a', mobileNav).forEach(link => link.addEventListener('click', closeMenu));
document.addEventListener('keydown', event => { if (event.key === 'Escape') closeMenu(); });
document.addEventListener('click', event => {
  if (!mobileNav.hidden && !mobileNav.contains(event.target) && !menuToggle.contains(event.target)) closeMenu();
});

bookingForm.addEventListener('submit', event => {
  event.preventDefault();
  if (!bookingForm.reportValidity()) return;
  const values = Object.fromEntries(new FormData(bookingForm));
  if (values.date < bookingForm.elements.date.min) {
    notify('Please choose today or a future date.');
    bookingForm.elements.date.focus();
    return;
  }
  preparedRequest = values;
  const dateText = new Intl.DateTimeFormat('en', {weekday:'short', day:'numeric', month:'long', year:'numeric'}).format(new Date(values.date + 'T12:00:00'));
  const fields = [['Name', values.name], ['Email', values.email], ['Visit', values.service], ['Date', dateText], ['Time', values.time]];
  const summary = $('#request-summary');
  summary.replaceChildren();
  fields.forEach(([label, value]) => {
    const dt = document.createElement('dt');
    const dd = document.createElement('dd');
    dt.textContent = label;
    dd.textContent = value;
    summary.append(dt, dd);
  });
  $('#booking-intro').hidden = true;
  $('#booking-success').hidden = false;
  bookingDialog.scrollTop = 0;
  $('#download-request').focus();
});
$('#edit-request').addEventListener('click', () => {
  $('#booking-intro').hidden = false;
  $('#booking-success').hidden = true;
  bookingForm.elements.name.focus();
});
$('#download-request').addEventListener('click', () => {
  if (!preparedRequest) return;
  const r = preparedRequest;
  const text = `DENTORA — VISIT REQUEST\n\nName: ${r.name}\nEmail: ${r.email}\nService: ${r.service}\nPreferred date: ${r.date}\nPreferred time: ${r.time}\n\nThis is a request from a design concept, not a confirmed appointment.\nNo details have been sent to a clinic. Share this request with your clinic to confirm availability.`;
  const blob = new Blob([text], {type: 'text/plain;charset=utf-8'});
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `dentora-visit-request-${r.date}.txt`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  notify('Your visit request has been downloaded.');
});

const benefitTrack = $('#benefit-track');
function moveBenefits(direction) {
  const card = benefitTrack.firstElementChild;
  const step = card.getBoundingClientRect().width + 20;
  const end = benefitTrack.scrollWidth - benefitTrack.clientWidth;
  const motion = matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth';
  let target = benefitTrack.scrollLeft + direction * step;
  if (direction > 0 && benefitTrack.scrollLeft >= end - 5) target = 0;
  if (direction < 0 && benefitTrack.scrollLeft <= 5) target = end;
  benefitTrack.scrollTo({left: target, behavior: motion});
}
$('#benefit-prev').addEventListener('click', () => moveBenefits(-1));
$('#benefit-next').addEventListener('click', () => moveBenefits(1));

const stories = [
  {name:'Sarah M.', kind:'A calmer first visit', image:'assets/patient.jpg', quote:'I finally felt like someone was listening. Every step was explained, and I left feeling so much more confident.'},
  {name:'Alex R.', kind:'Care for the whole family', image:'assets/smile.jpg', quote:'A warm welcome and time for all our questions. It made a visit with the whole family feel much more manageable.'},
  {name:'Jamie L.', kind:'A fresh start for my smile', image:'assets/patient.jpg', quote:'No pressure, just a clear conversation about my options. Having a plan helped me take that first step.'}
];
let storyIndex = 0;
function changeStory(direction) {
  storyIndex = (storyIndex + direction + stories.length) % stories.length;
  const s = stories[storyIndex];
  $('#story-avatar').src = s.image;
  $('#story-person').textContent = s.name;
  $('#story-kind').textContent = s.kind;
  $('#stories-title').textContent = s.quote;
  $('#story-count').textContent = `0${storyIndex + 1} / 03`;
}
$('#story-prev').addEventListener('click', () => changeStory(-1));
$('#story-next').addEventListener('click', () => changeStory(1));

const articles = [
  {category:'Your first visit',title:'A first visit that feels a little more familiar.',body:'<p>New places can bring new questions. A first appointment is a chance to meet the team, talk about your concerns, and understand what comes next.</p><h3>Start with a conversation.</h3><p>Bring any questions you want to ask, along with the information your clinic requests before the visit. Let the team know if anything about dental care makes you nervous, so they can discuss how to support your comfort.</p><h3>Leave with a clearer picture.</h3><p>Your dentist can explain what they find, discuss available options, and help you understand the next steps. Ask about timing, costs, and anything you would like explained again.</p>'},
  {category:'Behind the scenes',title:'Thoughtful spaces. A more comfortable experience.',body:'<p>The way a space feels can make a difference. This Dentora concept pairs natural light, soft colors, and uncluttered spaces to create a calmer welcome.</p><h3>A place to pause.</h3><p>The design leaves room to breathe: open layouts, clear wayfinding, and comfortable seating. A friendly conversation matters just as much as the surroundings.</p><h3>Designed around people.</h3><p>Clinic details shown on this website are illustrative. Ask your clinic about accessibility, appointment support, and any accommodations you need before your visit.</p>'},
  {category:'Your smile, your way',title:'Make room for the questions on your mind.',body:'<p>A good conversation starts with what matters to you. You might want to ask about a change you have noticed, understand an option, or simply know what to expect from an appointment.</p><h3>A few questions to bring along.</h3><p>What are the available options? What happens at the next visit? How much time should I allow? What does the cost include? You can write your questions down in advance.</p><h3>Take your time.</h3><p>Your dentist is the right person to discuss your individual needs. This journal is part of a website design concept and does not provide personal dental advice.</p>'}
];
function showContent(category, title, body, trigger) {
  lastTrigger = trigger;
  $('#content-category').textContent = category;
  $('#content-title').textContent = title;
  $('#content-body').innerHTML = body;
  contentDialog.showModal();
  document.body.classList.add('modal-open');
  contentDialog.scrollTop = 0;
}
$$('[data-article]').forEach(button => button.addEventListener('click', () => {
  const article = articles[Number(button.dataset.article)];
  showContent(article.category, article.title, article.body, button);
}));
$$('[data-info]').forEach(button => button.addEventListener('click', () => {
  if (button.dataset.info === 'privacy') showContent('Your privacy', 'A little clarity about your details.', '<p>This website is a design concept. Visit-request details stay in the current browser session until you download them or close the page. They are not sent to a clinic.</p><p>The preview newsletter signup stores an email address in this browser only. There is no mailing-list service connected. Clear your browser site data to remove a saved preview signup.</p><p>Fonts may load from Google Fonts. No advertising or analytics scripts are included.</p>', button);
  else showContent('Accessibility', 'A comfortable experience for everyone.', '<p>The page supports keyboard navigation, visible focus indicators, reduced motion preferences, and layouts that adapt to different screen sizes.</p><p>Dialog windows can be closed with Escape, and every form field has a visible label. If you need help planning a visit, please use your clinic’s direct contact details once they have been added to this concept.</p>', button);
}));
$('#newsletter-form').addEventListener('submit', event => {
  event.preventDefault();
  const emailInput = $('#newsletter-email');
  if (!emailInput.reportValidity()) return;
  try {
    localStorage.setItem('dentora-preview-newsletter', emailInput.value.trim());
    notify('Preview signup saved on this device. No email has been sent.');
    event.target.reset();
  } catch {
    notify('This browser cannot save the preview signup. No email has been sent.');
  }
});

if ('IntersectionObserver' in window) {
  const navObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        $$('.desktop-nav a').forEach(link => link.classList.toggle('active', link.hash === `#${entry.target.id}`));
      }
    });
  }, {rootMargin:'-10% 0px -65% 0px'});
  $$('#home, #about, #services, #stories, #contact').forEach(section => navObserver.observe(section));
}
