/**
 * Modern Footnotes - Vanilla JS replacement for Bigfoot.js
 * Provides interactive popup footnotes without jQuery dependency
 */

class ModernFootnotes {
  constructor(options = {}) {
    this.options = {
      selector: 'a[href^="#fn:"], a[rel="footnote"]',
      popoverClass: 'footnote-popover',
      activeClass: 'footnote-active',
      hoverDelay: 250,
      deleteOnUnhover: false,
      preventPageScroll: false,
      maxWidth: 320,
      ...options
    };

    this.activePopover = null;
    this.hoverTimeout = null;
    this.popovers = new Map();
    
    this.init();
  }

  init() {
    // Find all footnote links
    this.footnoteLinks = document.querySelectorAll(this.options.selector);
    
    if (this.footnoteLinks.length === 0) return;

    // Process each footnote link
    this.footnoteLinks.forEach(link => this.processFootnoteLink(link));
    
    // Add global click listener to close popovers
    document.addEventListener('click', this.handleDocumentClick.bind(this));
    document.addEventListener('keydown', this.handleKeydown.bind(this));
    
    // Handle window resize
    window.addEventListener('resize', this.handleResize.bind(this));
  }

  processFootnoteLink(link) {
    const footnoteId = link.getAttribute('href');
    const footnoteContent = document.querySelector(footnoteId);
    
    if (!footnoteContent) return;

    // Create footnote button
    const button = this.createFootnoteButton(link, footnoteContent);
    
    // Replace original link with button
    link.parentNode.replaceChild(button, link);
  }

  createFootnoteButton(originalLink, footnoteContent) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'footnote-button';
    button.innerHTML = originalLink.textContent;
    button.setAttribute('aria-expanded', 'false');
    button.setAttribute('aria-describedby', footnoteContent.id);
    
    // Store reference to footnote content
    button._footnoteContent = footnoteContent.cloneNode(true);
    
    // Add event listeners
    button.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.togglePopover(button);
    });

    if (!this.options.deleteOnUnhover) {
      button.addEventListener('mouseenter', () => {
        this.clearHoverTimeout();
        this.hoverTimeout = setTimeout(() => {
          this.showPopover(button);
        }, this.options.hoverDelay);
      });

      button.addEventListener('mouseleave', () => {
        this.clearHoverTimeout();
      });
    }

    return button;
  }

  togglePopover(button) {
    if (this.activePopover && this.activePopover.button === button) {
      this.hidePopover();
    } else {
      this.showPopover(button);
    }
  }

  showPopover(button) {
    // Hide existing popover
    this.hidePopover();

    const popover = this.createPopover(button);
    document.body.appendChild(popover);
    
    // Position popover
    this.positionPopover(button, popover);
    
    // Store active popover reference
    this.activePopover = { button, popover };
    this.popovers.set(button, popover);
    
    // Update button state
    button.classList.add(this.options.activeClass);
    button.setAttribute('aria-expanded', 'true');
    
    // Animate in
    requestAnimationFrame(() => {
      popover.classList.add('footnote-popover--visible');
    });
  }

  hidePopover() {
    if (!this.activePopover) return;

    const { button, popover } = this.activePopover;
    
    // Animate out
    popover.classList.remove('footnote-popover--visible');
    
    // Clean up after animation
    setTimeout(() => {
      if (popover.parentNode) {
        popover.parentNode.removeChild(popover);
      }
      this.popovers.delete(button);
    }, 200);
    
    // Update button state
    button.classList.remove(this.options.activeClass);
    button.setAttribute('aria-expanded', 'false');
    
    this.activePopover = null;
  }

  createPopover(button) {
    const popover = document.createElement('div');
    popover.className = this.options.popoverClass;
    popover.setAttribute('role', 'tooltip');
    
    // Create content wrapper
    const content = document.createElement('div');
    content.className = 'footnote-popover__content';
    
    // Clone and clean footnote content
    const footnoteContent = button._footnoteContent.cloneNode(true);
    this.cleanFootnoteContent(footnoteContent);
    
    content.appendChild(footnoteContent);
    popover.appendChild(content);
    
    // Add close button
    const closeButton = document.createElement('button');
    closeButton.type = 'button';
    closeButton.className = 'footnote-popover__close';
    closeButton.innerHTML = '×';
    closeButton.setAttribute('aria-label', 'Close footnote');
    closeButton.addEventListener('click', () => this.hidePopover());
    
    popover.appendChild(closeButton);
    
    return popover;
  }

  cleanFootnoteContent(content) {
    // Remove backref links
    const backrefs = content.querySelectorAll('.footnote-backref, .footnote-return, a[href^="#fnref:"]');
    backrefs.forEach(el => el.remove());
    
    // Remove the footnote ID to avoid duplicates
    content.removeAttribute('id');
    
    return content;
  }

  positionPopover(button, popover) {
    const buttonRect = button.getBoundingClientRect();
    const popoverRect = popover.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const scrollTop = window.pageYOffset;
    const scrollLeft = window.pageXOffset;
    
    let left, top;
    
    // Calculate horizontal position
    left = buttonRect.left + scrollLeft + (buttonRect.width / 2) - (popoverRect.width / 2);
    
    // Ensure popover stays within viewport
    if (left < 10) {
      left = 10;
    } else if (left + popoverRect.width > viewportWidth - 10) {
      left = viewportWidth - popoverRect.width - 10;
    }
    
    // Calculate vertical position
    const spaceAbove = buttonRect.top;
    const spaceBelow = viewportHeight - buttonRect.bottom;
    
    if (spaceBelow >= popoverRect.height + 10 || spaceBelow > spaceAbove) {
      // Position below button
      top = buttonRect.bottom + scrollTop + 5;
      popover.classList.add('footnote-popover--below');
    } else {
      // Position above button
      top = buttonRect.top + scrollTop - popoverRect.height - 5;
      popover.classList.add('footnote-popover--above');
    }
    
    popover.style.left = `${left}px`;
    popover.style.top = `${top}px`;
    popover.style.maxWidth = `${this.options.maxWidth}px`;
  }

  handleDocumentClick(e) {
    if (!this.activePopover) return;
    
    const { popover } = this.activePopover;
    
    // Check if click is outside popover and button
    if (!popover.contains(e.target) && !e.target.classList.contains('footnote-button')) {
      this.hidePopover();
    }
  }

  handleKeydown(e) {
    if (e.key === 'Escape' && this.activePopover) {
      this.hidePopover();
    }
  }

  handleResize() {
    if (this.activePopover) {
      const { button, popover } = this.activePopover;
      this.positionPopover(button, popover);
    }
  }

  clearHoverTimeout() {
    if (this.hoverTimeout) {
      clearTimeout(this.hoverTimeout);
      this.hoverTimeout = null;
    }
  }

  destroy() {
    // Clean up event listeners and popovers
    this.hidePopover();
    document.removeEventListener('click', this.handleDocumentClick);
    document.removeEventListener('keydown', this.handleKeydown);
    window.removeEventListener('resize', this.handleResize);
    
    // Restore original footnote links
    document.querySelectorAll('.footnote-button').forEach(button => {
      const originalLink = document.createElement('a');
      originalLink.href = `#${button._footnoteContent.id}`;
      originalLink.textContent = button.textContent;
      originalLink.rel = 'footnote';
      
      button.parentNode.replaceChild(originalLink, button);
    });
  }
}

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.modernFootnotes = new ModernFootnotes();
  });
} else {
  window.modernFootnotes = new ModernFootnotes();
}

export default ModernFootnotes;