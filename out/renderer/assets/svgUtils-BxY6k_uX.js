function showToast(message, type = "info") {
  let container = document.getElementById("toast-container");
  if (!container) {
    container = document.createElement("div");
    container.id = "toast-container";
    Object.assign(container.style, {
      position: "fixed",
      bottom: "24px",
      right: "24px",
      display: "flex",
      flexDirection: "column",
      gap: "12px",
      zIndex: "9999",
      pointerEvents: "none"
    });
    document.body.appendChild(container);
  }
  const toast = document.createElement("div");
  Object.assign(toast.style, {
    padding: "12px 20px",
    borderRadius: "12px",
    color: "#fff",
    fontFamily: "Inter, sans-serif",
    fontSize: "0.9rem",
    fontWeight: "500",
    boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
    display: "flex",
    alignItems: "center",
    gap: "10px",
    transform: "translateX(120%)",
    transition: "transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s ease",
    pointerEvents: "auto",
    backdropFilter: "blur(10px)",
    border: "1px solid rgba(255,255,255,0.1)",
    minWidth: "250px"
  });
  let icon = "";
  if (type === "success") {
    toast.style.background = "rgba(16, 185, 129, 0.85)";
    toast.style.borderColor = "rgba(16, 185, 129, 0.3)";
    icon = "✅";
  } else if (type === "error") {
    toast.style.background = "rgba(239, 68, 68, 0.85)";
    toast.style.borderColor = "rgba(239, 68, 68, 0.3)";
    icon = "❌";
  } else {
    toast.style.background = "rgba(59, 130, 246, 0.85)";
    toast.style.borderColor = "rgba(59, 130, 246, 0.3)";
    icon = "ℹ️";
  }
  toast.innerHTML = `<span>${icon}</span> <span>${message}</span>`;
  container.appendChild(toast);
  requestAnimationFrame(() => {
    toast.style.transform = "translateX(0)";
  });
  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateY(-10px)";
    setTimeout(() => toast.remove(), 300);
  }, 3e3);
}
const SVG_EMPTY_FOLDER = `
<svg class="empty-state-svg" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M4 7V17C4 18.1046 4.89543 19 6 19H18C19.1046 19 20 18.1046 20 17V10C20 8.89543 19.1046 8 18 8H11.5L9.5 6H6C4.89543 6 4 6.89543 4 8Z" fill="url(#paint0_linear)" fill-opacity="0.2"/>
<path d="M11.5 8H18C19.1046 8 20 8.89543 20 10V17C20 18.1046 19.1046 19 18 19H6C4.89543 19 4 18.1046 4 17V7M4 7C4 6.44772 4.44772 6 5 6H9.5L11.5 8M4 7V8" stroke="#38BDF8" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
<defs>
<linearGradient id="paint0_linear" x1="12" y1="6" x2="12" y2="19" gradientUnits="userSpaceOnUse">
<stop stop-color="#38BDF8"/>
<stop offset="1" stop-color="#38BDF8" stop-opacity="0"/>
</linearGradient>
</defs>
</svg>
`;
const SVG_EMPTY_TICKET = `
<svg class="empty-state-svg" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M5 8H19V17C19 18.1046 18.1046 19 17 19H7C5.89543 19 5 18.1046 5 17V8Z" fill="url(#paint1_linear)" fill-opacity="0.2"/>
<path d="M5 8V17C5 18.1046 5.89543 19 7 19H17C18.1046 19 19 18.1046 19 17V8M5 8H19M5 8L12 13L19 8" stroke="#38BDF8" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M9 16H15" stroke="#38BDF8" stroke-width="1.5" stroke-linecap="round"/>
<defs>
<linearGradient id="paint1_linear" x1="12" y1="8" x2="12" y2="19" gradientUnits="userSpaceOnUse">
<stop stop-color="#10B981"/>
<stop offset="1" stop-color="#10B981" stop-opacity="0"/>
</linearGradient>
</defs>
</svg>
`;
const SVG_EMPTY_STAR = `
<svg class="empty-state-svg" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M12 4.5L14.3175 9.19523L19.5 9.94921L15.75 13.6053L16.635 18.775L12 16.3375L7.365 18.775L8.25 13.6053L4.5 9.94921L9.6825 9.19523L12 4.5Z" fill="url(#paint2_linear)" fill-opacity="0.2"/>
<path d="M12 4.5L14.3175 9.19523L19.5 9.94921L15.75 13.6053L16.635 18.775L12 16.3375L7.365 18.775L8.25 13.6053L4.5 9.94921L9.6825 9.19523L12 4.5Z" stroke="#F59E0B" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
<defs>
<linearGradient id="paint2_linear" x1="12" y1="4.5" x2="12" y2="18.775" gradientUnits="userSpaceOnUse">
<stop stop-color="#F59E0B"/>
<stop offset="1" stop-color="#F59E0B" stop-opacity="0"/>
</linearGradient>
</defs>
</svg>
`;
export {
  SVG_EMPTY_FOLDER as S,
  SVG_EMPTY_TICKET as a,
  SVG_EMPTY_STAR as b,
  showToast as s
};
