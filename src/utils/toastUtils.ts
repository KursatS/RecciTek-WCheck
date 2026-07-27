export function showToast(message: string, type: 'success' | 'error' | 'info' = 'info') {
    // Check if container exists
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        Object.assign(container.style, {
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            zIndex: '9999',
            pointerEvents: 'none'
        });
        document.body.appendChild(container);
    }

    const toast = document.createElement('div');

    // Base styles
    Object.assign(toast.style, {
        padding: '12px 20px',
        borderRadius: '12px',
        color: '#fff',
        fontFamily: 'Inter, sans-serif',
        fontSize: '0.9rem',
        fontWeight: '500',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        transform: 'translateX(120%)',
        transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s ease',
        pointerEvents: 'auto',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255,255,255,0.1)',
        minWidth: '250px'
    });

    let icon = '';
    if (type === 'success') {
        toast.style.background = 'rgba(16, 185, 129, 0.85)';
        toast.style.borderColor = 'rgba(16, 185, 129, 0.3)';
        icon = '✅';
    } else if (type === 'error') {
        toast.style.background = 'rgba(239, 68, 68, 0.85)';
        toast.style.borderColor = 'rgba(239, 68, 68, 0.3)';
        icon = '❌';
    } else {
        toast.style.background = 'rgba(59, 130, 246, 0.85)';
        toast.style.borderColor = 'rgba(59, 130, 246, 0.3)';
        icon = 'ℹ️';
    }

    const iconSpan = document.createElement('span');
    iconSpan.textContent = icon;
    const messageSpan = document.createElement('span');
    messageSpan.textContent = message;
    toast.append(iconSpan, messageSpan);
    container.appendChild(toast);

    // Animate in
    requestAnimationFrame(() => {
        toast.style.transform = 'translateX(0)';
    });

    // Animate out and remove after 3s
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(-10px)';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}
