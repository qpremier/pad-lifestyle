class DetailsDisclosure extends HTMLElement {
  constructor() {
    super();
    this.mainDetailsToggle = this.querySelector('details');
    this.content = this.mainDetailsToggle.querySelector('summary').nextElementSibling;

    this.mainDetailsToggle.addEventListener('focusout', this.onFocusOut.bind(this));
    this.mainDetailsToggle.addEventListener('toggle', this.onToggle.bind(this));
  }

  onFocusOut() {
    setTimeout(() => {
      if (!this.contains(document.activeElement)) this.close();
    });
  }

  onToggle() {
    if (!this.animations) this.animations = this.content.getAnimations();

    if (this.mainDetailsToggle.hasAttribute('open')) {
      this.animations.forEach((animation) => animation.play());
    } else {
      this.animations.forEach((animation) => animation.cancel());
    }
  }

  close() {
    this.mainDetailsToggle.removeAttribute('open');
    this.mainDetailsToggle.querySelector('summary').setAttribute('aria-expanded', false);
  }
}

customElements.define('details-disclosure', DetailsDisclosure);

class HeaderMenu extends DetailsDisclosure {
  constructor() {
    super();
    this.header = document.querySelector('.header-wrapper');
    this.summary = this.mainDetailsToggle.querySelector('summary');
    this.hoverMediaQuery = window.matchMedia('(min-width: 990px)');
    this.closeDelay = 180;
    this.closeTimeout = null;

    this.boundOnMouseEnter = this.onMouseEnter.bind(this);
    this.boundOnMouseLeave = this.onMouseLeave.bind(this);
    this.boundOnSummaryClick = this.onSummaryClick.bind(this);
    this.boundOnSubmenuMouseEnter = this.onSubmenuMouseEnter.bind(this);
    this.boundOnSubmenuMouseLeave = this.onSubmenuMouseLeave.bind(this);
    this.boundOnSubmenuClick = this.onSubmenuClick.bind(this);

    this.mainDetailsToggle.addEventListener('mouseenter', this.boundOnMouseEnter);
    this.mainDetailsToggle.addEventListener('mouseleave', this.boundOnMouseLeave);
    this.summary.addEventListener('click', this.boundOnSummaryClick);

    this.submenuDetails = Array.from(this.mainDetailsToggle.querySelectorAll('.header__submenu details'));
    this.submenuDetails.forEach((submenu) => {
      const submenuSummary = submenu.querySelector('summary');

      if (!submenuSummary) return;

      submenu.addEventListener('mouseenter', this.boundOnSubmenuMouseEnter);
      submenu.addEventListener('mouseleave', this.boundOnSubmenuMouseLeave);
      submenuSummary.addEventListener('click', this.boundOnSubmenuClick);
    });
  }

  onToggle() {
    if (!this.header) return;
    this.header.preventHide = this.mainDetailsToggle.open;

    if (document.documentElement.style.getPropertyValue('--header-bottom-position-desktop') !== '') return;
    document.documentElement.style.setProperty(
      '--header-bottom-position-desktop',
      `${Math.floor(this.header.getBoundingClientRect().bottom)}px`
    );
  }

  isDesktopHoverMenu() {
    return this.hoverMediaQuery.matches;
  }

  updateDesktopSubmenuPosition() {
    if (!this.isDesktopHoverMenu() || !this.header || !this.content?.classList.contains('header__submenu')) return;

    const headerBottom = this.header.getBoundingClientRect().bottom;
    const detailsTop = this.mainDetailsToggle.getBoundingClientRect().top;
    const submenuTop = Math.max(0, Math.round(headerBottom - detailsTop));

    this.content.style.top = `${submenuTop}px`;
  }

  setExpanded(detailsElement, isExpanded) {
    if (!detailsElement) return;

    const summary = detailsElement.querySelector(':scope > summary');
    if (isExpanded) {
      detailsElement.setAttribute('open', '');
    } else {
      detailsElement.removeAttribute('open');
    }

    if (summary) {
      summary.setAttribute('aria-expanded', isExpanded ? 'true' : 'false');
    }
  }

  clearCloseTimeout() {
    if (!this.closeTimeout) return;
    window.clearTimeout(this.closeTimeout);
    this.closeTimeout = null;
  }

  scheduleClose(callback) {
    this.clearCloseTimeout();
    this.closeTimeout = window.setTimeout(() => {
      this.closeTimeout = null;
      callback();
    }, this.closeDelay);
  }

  closeSiblingSubmenus(submenu) {
    const parentMenu = submenu?.closest('.header__submenu');
    if (!parentMenu) return;

    parentMenu.querySelectorAll(':scope > li > details[open]').forEach((siblingSubmenu) => {
      if (siblingSubmenu === submenu) return;
      this.closeSubmenu(siblingSubmenu);
    });
  }

  onMouseEnter() {
    if (!this.isDesktopHoverMenu()) return;
    this.clearCloseTimeout();
    this.updateDesktopSubmenuPosition();
    this.setExpanded(this.mainDetailsToggle, true);
  }

  onMouseLeave() {
    if (!this.isDesktopHoverMenu()) return;
    this.scheduleClose(() => this.close());
  }

  onSummaryClick(event) {
    if (!this.isDesktopHoverMenu()) return;
    event.preventDefault();
    this.updateDesktopSubmenuPosition();
    this.setExpanded(this.mainDetailsToggle, true);
  }

  onSubmenuMouseEnter(event) {
    if (!this.isDesktopHoverMenu()) return;
    this.clearCloseTimeout();
    this.closeSiblingSubmenus(event.currentTarget);
    this.setExpanded(event.currentTarget, true);
  }

  onSubmenuMouseLeave(event) {
    if (!this.isDesktopHoverMenu()) return;
    const currentSubmenu = event.currentTarget;
    this.scheduleClose(() => this.closeSubmenu(currentSubmenu));
  }

  onSubmenuClick(event) {
    if (!this.isDesktopHoverMenu()) return;
    event.preventDefault();
    const currentSubmenu = event.currentTarget.closest('details');
    this.closeSiblingSubmenus(currentSubmenu);
    this.setExpanded(currentSubmenu, true);
  }

  closeSubmenu(submenu) {
    this.setExpanded(submenu, false);
    submenu.querySelectorAll('details[open]').forEach((nestedSubmenu) => this.setExpanded(nestedSubmenu, false));
  }

  close() {
    this.clearCloseTimeout();
    this.submenuDetails.forEach((submenu) => this.closeSubmenu(submenu));
    super.close();
  }
}

customElements.define('header-menu', HeaderMenu);
