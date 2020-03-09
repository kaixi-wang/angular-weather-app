document.addEventListener("DOMContentLoaded", function () {

  document.getElementById('currentLocationCheck').onchange = function () {
    document.getElementById('manualInput').disabled = this.checked;
    if (document.getElementById('manualInput').disabled) {
      var inputs = inputForm.manualInput.elements;
      for (i = 0; i < inputs.length; i++) {
        inputs[i].value = "";
      }

    }

  };
  document.getElementById('manualInput').disabled = document.getElementById('currentLocationCheck').checked;
});
