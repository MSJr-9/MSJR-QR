const QRGenerator = (() => {
  let qrInstance = null;
  let currentLogoDataUrl = null;

  function getContainer() {
    return document.getElementById('qrPreview');
  }

  function buildOptions(payload, settings) {
    const {
      fgColor = '#f0211a',
      bgColor = '#0b0b0f',
      transparentBg = false,
      dotStyle = 'rounded',
      cornerStyle = 'dot',
      errorLevel = 'Q',
      logoSize = 0.4,
      exportSize = 600
    } = settings;

    const options = {
      width: exportSize,
      height: exportSize,
      data: payload,
      margin: 10,
      qrOptions: { errorCorrectionLevel: errorLevel },
      dotsOptions: {
        color: fgColor,
        type: dotStyle
      },
      backgroundOptions: {
        color: transparentBg ? 'transparent' : bgColor
      },
      cornersSquareOptions: {
        type: cornerStyle === 'dot' ? 'dot' : cornerStyle,
        color: fgColor
      },
      cornersDotOptions: {
        type: cornerStyle === 'dot' ? 'dot' : 'square',
        color: fgColor
      },
      imageOptions: {
        crossOrigin: 'anonymous',
        margin: 5,
        imageSize: parseFloat(logoSize),
        hideBackgroundDots: true
      }
    };

    if (currentLogoDataUrl) {
      options.image = currentLogoDataUrl;
    }

    return options;
  }

  function render(payload, settings) {
    const container = getContainer();
    container.innerHTML = '';

    if (!payload) {
      document.getElementById('previewEmpty').classList.remove('hidden');
      return null;
    }

    document.getElementById('previewEmpty').classList.add('hidden');

    const options = buildOptions(payload, settings);

    if (qrInstance) {
      qrInstance.update(options);
    } else {
      qrInstance = new QRCodeStyling(options);
      qrInstance.append(container);
    }

    return qrInstance;
  }

  function download(extension, size) {
    if (!qrInstance) return;
    // Update size temporarily for export
    const currentOptions = qrInstance._options;
    const originalWidth = currentOptions.width;
    const originalHeight = currentOptions.height;
    qrInstance.update({ width: size, height: size });
    qrInstance.download({ name: `msjr-qr-${Date.now()}`, extension });
    // Restore
    setTimeout(() => qrInstance.update({ width: originalWidth, height: originalHeight }), 100);
  }

  function setLogo(dataUrl) {
    currentLogoDataUrl = dataUrl;
    if (dataUrl) {
      document.getElementById('removeLogo').classList.remove('hidden');
    } else {
      document.getElementById('removeLogo').classList.add('hidden');
    }
  }

  function getLogo() {
    return currentLogoDataUrl;
  }

  function reset() {
    qrInstance = null;
    currentLogoDataUrl = null;
    getContainer().innerHTML = '';
    document.getElementById('previewEmpty').classList.remove('hidden');
    document.getElementById('removeLogo').classList.add('hidden');
  }

  return { render, download, setLogo, getLogo, reset };
})();