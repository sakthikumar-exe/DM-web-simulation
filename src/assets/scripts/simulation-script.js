const autoSetToggle = document.getElementById('autoSet');
const rcInput = document.getElementById('RC');

autoSetToggle.addEventListener('click', () => {
    autoSetToggle.classList.toggle('active');
    rcInput.disabled = autoSetToggle.classList.contains('active');
});

const stepApproxToggle = document.getElementById('stepApprox');
if (stepApproxToggle) {
    stepApproxToggle.addEventListener('click', () => {
        stepApproxToggle.classList.toggle('active');
    });
}

