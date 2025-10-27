
// Title counter
document.addEventListener('DOMContentLoaded', () => {
  const textarea1 = document.querySelector('textarea#head');
  const current1 = document.getElementById('current1');
  const maximum1 = document.getElementById('maximum1');

  if (!textarea1 || !current1 || !maximum1) return;

  // initialize
  current1.textContent = textarea1.value.length;
  maximum1.textContent = '/ ' + (textarea1.getAttribute('maxlength') || '64');

  // update on input
  textarea1.addEventListener('input', () => {
    current1.textContent = textarea1.value.length;
  });
});


// Caption counter
document.addEventListener('DOMContentLoaded', () => {
  const textarea2 = document.querySelector('textarea#title');
  const current2 = document.getElementById('current2');
  const maximum2 = document.getElementById('maximum2');

  if (!textarea2 || !current2 || !maximum2) return;

  // initialize
  current2.textContent = textarea2.value.length;
  maximum2.textContent = '/ ' + (textarea2.getAttribute('maxlength') || '1024');

  // update on input
  textarea2.addEventListener('input', () => {
    current2.textContent = textarea2.value.length;
  });
});