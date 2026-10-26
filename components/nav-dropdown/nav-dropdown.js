import { fetchHtmlContent, getStylesheet } from '../../utils/utils.js';

class NavDropdownComponent extends HTMLElement {
  
  set dropdownItemsData(data) {
    this._dropdownItemsData = Array.isArray(data) ? data: [];
    if (this.menuList) {
      this.addDropdownItems();
    }
  }

  set selected(key) {
    this._selected = key;

    if (this.menuList) {
      this.selectOption(key);
    }
  }

  static get SOURCE_URL() {
    return new URL('./nav-dropdown.html', import.meta.url);
  }

  constructor() {
    super();

    this.attachShadow({ mode: 'open' });

  }

  async connectedCallback() {
    this.navDropdown = null;
    this.menuBtn = null;
    this.menuList = null;
    this.listItems = [];
    this.caretIcon = null;
    this.selectedIndex = -1;
    this._dropdownItemsData = [];

    await this.loadTemplate();
    await this.adoptStylesheets();

    this.navDropdown = this.shadowRoot.querySelector('.nav-dropdown');
    this.menuBtn = this.shadowRoot.querySelector('.menu-btn');
    this.menuList = this.shadowRoot.querySelector('.menu-list');
    this.listItems = this.shadowRoot.querySelectorAll('.menu-item');
    this.caretIcon = this.shadowRoot.querySelector('i');

    if (this._dropdownItemsData.length) {
      this.addDropdownItems();
      this.selectOption(this._selected);
    }

    this.setupEventListeners();
    this.setupMutationObserver();
    this.resizeObserver = new ResizeObserver((entries) => this.handleViewportResize(entries));
    this.resizeObserver.observe(document.body);

    this.handleDocumentClick = (event) => {
      const clickedInside = event.composedPath().includes(this);
      if (!clickedInside) {
        this.menuClosed();
      }
    }
    document.addEventListener('click', this.handleDocumentClick);
  }

  async loadTemplate() {
    try {
      const doc = await fetchHtmlContent(NavDropdownComponent.SOURCE_URL);

      const template = doc.querySelector('#nav-dropdown-template');

      if (template) {
        this.shadowRoot.appendChild(template.content.cloneNode(true)); // clone b/c appendChild() is a move operation (and moves from previous parent to new location), not a copy operation
      } else {
        console.error('Template element not found in the fetched file');
      }
    } catch (error) {
      console.error('Could not process source URL: ', error);
    }
  }

  async adoptStylesheets() {
    const cssUrls = [
      new URL('./nav-dropdown.css', import.meta.url),
      'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/7.0.1/css/all.min.css'
    ];

    const stylesheets = await Promise.all(cssUrls.map(getStylesheet));
    this.shadowRoot.adoptedStyleSheets = stylesheets;
  }

  addDropdownItems() {
    const items = this._dropdownItemsData || [];
    // Create a fragment (inivisible container) to prevent multiple reflows (re-calculations of the layout) -> requires one update
    const fragment = document.createDocumentFragment();

    items.forEach((data, i) => {
      const li = document.createElement('li');
      li.classList.add('menu-item');
      li.dataset.itemIndex = String(i);

      const link = document.createElement('a');
      link.href = data.link || "#";
      li.appendChild(link);

      const span = document.createElement('span');
      span.classList.add('item-label');
      span.textContent = data.label;
      link.appendChild(span);

      fragment.appendChild(li);
    });

    this.menuList.appendChild(fragment);
  }

  selectOption(key) {
    const index = this._dropdownItemsData.findIndex(item => {
      return item.key === key;
    });
    
    if (index === -1) return;

    this.listItems = this.shadowRoot.querySelectorAll('.menu-item');

    this.listItems.forEach(item => {
      item.classList.remove('selected');
    });

    this.listItems[index].classList.add('selected');
    this.selectedIndex = index;
  }

  setupEventListeners() {
    this.menuBtn.addEventListener('click', (e) => this.onMenuBtnClick(e));
    this.menuList.addEventListener('click', (e) => this.onMenuListClick(e));
    this.shadowRoot.addEventListener('click', (e) => this.onNavComponentClick(e));
  }

  setupMutationObserver() {
    const observer = new MutationObserver((mutations) => {
      for (let mutation of mutations) {
        if (mutation.attributeName === 'data-close') {       
          this.menuClosed();
        }
      }
    });
    observer.observe(this, {
      attributes: true,
      attributeFilter: ['data-close']
    });
  }

  handleViewportResize(entries) {
    for (let entry of entries) {
      const viewportWidth = entry.contentRect.width;

      if (viewportWidth < 768) {
        this.navDropdown.classList.add('mobile');
      } else {
        this.navDropdown.classList.remove('mobile');
      }
    }
  }

  onMenuBtnClick() {
    const isOpen = this.navDropdown.classList.contains('open');

    if (!isOpen) {
      this.menuOpened();
    } else {
      this.menuClosed();
    }
  }

  menuOpened() {
    document.body.classList.add('mobile-menu-open');
    this.navDropdown.classList.add('open');
    this.menuList.classList.remove('closed');
    this.caretIcon.classList.replace('fa-caret-down', 'fa-caret-up');
    this.menuBtn.setAttribute('aria-expanded', true);
  }

  menuClosed() {
    document.body.classList.remove('mobile-menu-open');
    this.navDropdown.classList.remove('open');
    this.menuList.classList.add('closed');
    this.caretIcon.classList.replace('fa-caret-up', 'fa-caret-down');
    this.menuBtn.setAttribute('aria-expanded', false);
  }

  onMenuListClick(e) {
    const target = e.target.closest('.menu-item');
    this.listItems = this.shadowRoot.querySelectorAll('.menu-item');

    if (target) {
      const targetIndex = parseInt(target.dataset.itemIndex);
      if (targetIndex !== this.selectedIndex) {
        target.classList.add('selected');

        if (this.selectedIndex !== -1) {
          this.listItems[this.selectedIndex].classList.remove('selected');
        }
        this.selectedIndex = targetIndex;
      }
      this.menuClosed();
    }
  }

  onNavComponentClick(e) {
    if (e.target.closest('.menu-list') || e.target.closest('.menu-btn') || e.target.closest('.menu')) return;
  }

  disconnectedCallback() {
    this.menuBtn.removeEventListener('click', this.onMenuBtnClick);
    this.menuList.removeEventListener('click', this.onMenuListClick);
    document.removeEventListener('click', this.handleDocumentClick);
  }
}
customElements.define('nav-dropdown-component', NavDropdownComponent);