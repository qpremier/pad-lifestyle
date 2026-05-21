class MainSearch extends SearchForm {
  constructor() {
    super();
    this.allSearchInputs = document.querySelectorAll('input[type="search"]');
    this.setupEventListeners();
  }

  setupEventListeners() {
    let allSearchForms = [];
    this.allSearchInputs.forEach((input) => allSearchForms.push(input.form));
    this.input.addEventListener('focus', this.onInputFocus.bind(this));
    if (allSearchForms.length < 2) return;
    allSearchForms.forEach((form) => form.addEventListener('reset', this.onFormReset.bind(this)));
    this.allSearchInputs.forEach((input) => input.addEventListener('input', this.onInput.bind(this)));
  }

  onFormReset(event) {
    super.onFormReset(event);
    if (super.shouldResetForm()) {
      this.keepInSync('', this.input);
    }
  }

  onInput(event) {
    const target = event.target;
    this.keepInSync(target.value, target);
  }

  onInputFocus() {
    const isSmallScreen = window.innerWidth < 750;
    if (isSmallScreen) {
      this.scrollIntoView({ behavior: 'smooth' });
    }
  }

  keepInSync(value, target) {
    this.allSearchInputs.forEach((input) => {
      if (input !== target) {
        input.value = value;
      }
    });
  }
}

customElements.define('main-search', MainSearch);

class SearchResultsTabs extends HTMLElement {
  constructor() {
    super();
    this.onTabClick = this.onTabClick.bind(this);
    this.onPopState = this.onPopState.bind(this);
  }

  connectedCallback() {
    this.addEventListener('click', this.onTabClick);
    window.addEventListener('popstate', this.onPopState);
  }

  disconnectedCallback() {
    this.removeEventListener('click', this.onTabClick);
    window.removeEventListener('popstate', this.onPopState);
  }

  onTabClick(event) {
    const tab = event.target.closest('.template-search__tab');

    if (!tab || !this.contains(tab) || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

    event.preventDefault();

    if (tab.getAttribute('aria-selected') === 'true' || this.classList.contains('is-loading')) return;
    if (!tab.dataset.url) return;

    this.loadTab(tab.dataset.url, true);
  }

  onPopState() {
    this.loadTab(window.location.href, false);
  }

  loadTab(url, updateHistory) {
    const requestUrl = this.getSectionUrl(url);

    this.classList.add('is-loading');
    this.setAttribute('aria-busy', 'true');

    fetch(requestUrl)
      .then((response) => response.text())
      .then((responseText) => {
        const html = new DOMParser().parseFromString(responseText, 'text/html');
        const newTabs = html.querySelector(`search-results-tabs[data-section-id="${this.dataset.sectionId}"]`);

        if (!newTabs) {
          window.location.href = url;
          return;
        }

        this.className = newTabs.className;
        this.innerHTML = newTabs.innerHTML;
        this.removeAttribute('aria-busy');

        if (updateHistory) history.pushState({ searchResultsUrl: url }, '', url);

        if (typeof FacetFiltersForm !== 'undefined') {
          FacetFiltersForm.filterData = [];
          FacetFiltersForm.searchParamsInitial = window.location.search.slice(1);
          FacetFiltersForm.searchParamsPrev = window.location.search.slice(1);
        }

        this.querySelector('.template-search__tab[aria-selected="true"]')?.focus({ preventScroll: true });
      })
      .catch(() => {
        window.location.href = url;
      })
      .finally(() => {
        this.classList.remove('is-loading');
        this.removeAttribute('aria-busy');
      });
  }

  getSectionUrl(url) {
    const sectionUrl = new URL(url, window.location.origin);
    sectionUrl.searchParams.set('section_id', this.dataset.sectionId);

    return sectionUrl.toString();
  }
}

customElements.define('search-results-tabs', SearchResultsTabs);
