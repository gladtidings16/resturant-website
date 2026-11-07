const menuTabs = [...document.querySelectorAll(".menu-tab")];
const menuPanels = [...document.querySelectorAll(".menu-panel")];

function activateMenuTab(tab) {
  menuTabs.forEach((item) => {
    const active = item === tab;
    item.classList.toggle("is-active", active);
    item.setAttribute("aria-selected", String(active));
    item.tabIndex = active ? 0 : -1;
  });
  menuPanels.forEach((panel) => {
    const active = panel.id === tab.getAttribute("aria-controls");
    panel.classList.toggle("is-active", active);
    panel.hidden = !active;
  });
}

menuTabs.forEach((tab, index) => {
  tab.addEventListener("click", () => activateMenuTab(tab));
  tab.addEventListener("keydown", (event) => {
    let nextIndex;
    if (event.key === "ArrowRight" || event.key === "ArrowDown") nextIndex = (index + 1) % menuTabs.length;
    if (event.key === "ArrowLeft" || event.key === "ArrowUp") nextIndex = (index - 1 + menuTabs.length) % menuTabs.length;
    if (event.key === "Home") nextIndex = 0;
    if (event.key === "End") nextIndex = menuTabs.length - 1;
    if (nextIndex !== undefined) {
      event.preventDefault();
      menuTabs[nextIndex].focus();
      activateMenuTab(menuTabs[nextIndex]);
    }
  });
});

const menuToggle = document.querySelector(".menu-toggle");
const primaryNav = document.querySelector(".primary-nav");

function closeNavigation() {
  menuToggle.setAttribute("aria-expanded", "false");
  menuToggle.setAttribute("aria-label", "Open navigation");
  primaryNav.classList.remove("is-open");
}

menuToggle.addEventListener("click", () => {
  const isOpen = menuToggle.getAttribute("aria-expanded") === "true";
  menuToggle.setAttribute("aria-expanded", String(!isOpen));
  menuToggle.setAttribute("aria-label", isOpen ? "Open navigation" : "Close navigation");
  primaryNav.classList.toggle("is-open", !isOpen);
});

primaryNav.querySelectorAll("a").forEach((link) => link.addEventListener("click", closeNavigation));
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") closeNavigation();
});

const lightbox = document.querySelector(".lightbox");
const lightboxImage = lightbox.querySelector("img");
const lightboxCaption = lightbox.querySelector(".lightbox-caption");

document.querySelectorAll(".gallery-item").forEach((item) => {
  item.addEventListener("click", () => {
    const image = item.querySelector("img");
    lightboxImage.src = item.dataset.full;
    lightboxImage.alt = image.alt;
    lightboxCaption.textContent = item.querySelector(".gallery-caption").textContent;
    lightbox.showModal();
  });
});

function closeLightbox() {
  lightbox.close();
}

lightbox.querySelector(".lightbox-close").addEventListener("click", closeLightbox);
lightbox.addEventListener("click", (event) => {
  if (event.target === lightbox) closeLightbox();
});
lightbox.addEventListener("close", () => {
  lightboxImage.removeAttribute("src");
});

const reservationForm = document.querySelector("#reservation-form");
const reservationMessage = document.querySelector("#reservation-message");
const dateField = reservationForm.elements.date;
const today = new Date();
const localToday = new Date(today.getTime() - today.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
dateField.min = localToday;

async function submitForm(form, message, successMessage) {
  const button = form.querySelector('[type="submit"]');
  const originalButtonContent = button.innerHTML;
  button.disabled = true;
  button.textContent = "Sending...";

  try {
    const response = await fetch(form.action, {
      method: "POST",
      body: new FormData(form),
      headers: { Accept: "application/json" }
    });
    if (!response.ok) throw new Error(`Form submission failed: ${response.status}`);

    message.textContent = successMessage;
    form.reset();
  } catch (error) {
    message.textContent = "Something went wrong. Please try again or call us on +2349155149831";
  } finally {
    button.innerHTML = originalButtonContent;
    button.disabled = false;
  }
}

reservationForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  reservationMessage.textContent = "";
  if (!reservationForm.reportValidity()) return;

  try {
    const formData = new FormData(reservationForm);
    const selectedDate = new Date(`${formData.get("date")}T00:00:00`);
    const selectedTime = formData.get("time");
    const [hourMinute, period] = selectedTime.split(" ");
    const [hourValue, minuteValue] = hourMinute.split(":").map(Number);
    const hour = (hourValue % 12) + (period === "PM" ? 12 : 0);
    selectedDate.setHours(hour, minuteValue, 0, 0);

    if (selectedDate < new Date()) {
      reservationMessage.textContent = "Please choose a future date and time.";
      dateField.focus();
      return;
    }

    await submitForm(
      reservationForm,
      reservationMessage,
      `Thanks, ${formData.get("name")}. Your table reservation request has been submitted successfully —please call +2349155149831 to confirm your table.`
    );
    dateField.min = localToday;
  } catch (error) {
    reservationMessage.textContent = "Something went wrong. Please try again or contact us on +2349155149831";
  }
});

document.querySelector("#newsletter-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const message = document.querySelector("#newsletter-message");
  message.textContent = "";
  if (!form.reportValidity()) return;
  await submitForm(
    form,
    message,
    "Thanks for your interest. This demo signup isn't connected to a mailing list yet."
  );
});

const dayHours = {
  0: { open: 16, close: 20, label: "4:00 – 8:00 pm" },
  1: null,
  2: { open: 17, close: 21, label: "5:00 – 9:00 pm" },
  3: { open: 17, close: 21, label: "5:00 – 9:00 pm" },
  4: { open: 17, close: 21, label: "5:00 – 9:00 pm" },
  5: { open: 17, close: 22, label: "5:00 – 10:00 pm" },
  6: { open: 17, close: 22, label: "5:00 – 10:00 pm" }
};

function updateOpenStatus() {
  const now = new Date();
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Africa/Lagos",
    weekday: "short",
    hour: "numeric",
    hourCycle: "h23"
  }).formatToParts(now);
  const weekday = parts.find((part) => part.type === "weekday").value;
  const hour = Number(parts.find((part) => part.type === "hour").value);
  const weekdayNumber = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(weekday);
  const hours = dayHours[weekdayNumber];
  const isOpen = Boolean(hours && hour >= hours.open && hour < hours.close);
  const statusText = document.querySelector("#open-status-text");
  const statusDot = document.querySelector(".status-dot");

  document.querySelectorAll(".hours-table tr").forEach((row) => {
    row.classList.toggle("is-today", Number(row.dataset.day) === weekdayNumber);
  });
  statusDot.classList.toggle("is-closed", !isOpen);
  if (isOpen) {
    statusText.textContent = `Open now · until ${hours.label.split("–")[1].trim()}`;
  } else if (hours) {
    statusText.textContent = `Closed now · today's hours ${hours.label}`;
  } else {
    statusText.textContent = "Closed today · back Tuesday";
  }
}

updateOpenStatus();
document.querySelector("#current-year").textContent = String(new Date().getFullYear());

if ("IntersectionObserver" in window && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });
  document.querySelectorAll(".reveal").forEach((element) => revealObserver.observe(element));
} else {
  document.querySelectorAll(".reveal").forEach((element) => element.classList.add("is-visible"));
}