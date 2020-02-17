(function() {
  class TurnipExtension extends window.Extension {
    constructor() {
      super('turnip-extension');
      this.addMenuEntry('Turnip Extension');

      this.content = '';
      fetch(`/extensions/${this.id}/static/views/content.html`)
        .then((res) => res.text())
        .then((text) => {
          this.content = text;
        })
        .catch((e) => console.error('Failed to fetch content:', e));
    }

    show() {
      this.view.innerHTML = this.content;

      const key = document.getElementById(
        'extension-turnip-extension-form-key');
      const value = document.getElementById(
        'extension-turnip-extension-form-value');
      const buttonCreate = document.getElementById(
        'extension-turnip-extension-content-user-section-01-button-create');
      const pre = document.getElementById(
        'extension-turnip-extension-response-data');

      buttonCreate.addEventListener('click', () => {
        window.API.postJson(
          `/extensions/${this.id}/api/turnip-api`,
          {
            [key.value]: value.value,
            jwt: window.API.jwt,
          }
        ).then((body) => {
          pre.innerText = JSON.stringify(body, null, 2);
        }).catch((e) => {
          pre.innerText = e.toString();
        });
      });
    }
  }

  new TurnipExtension();
})();

