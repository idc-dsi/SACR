/*
 *
 * SACR (Script d'Annotation de Chaînes de Référence): a coreference chain
 * annotation tool.
 * 
 * Copyright 2017 Bruno Oberlé.
 * 
 * This Source Code Form is subject to the terms of the Mozilla Public License,
 * v. 2.0. If a copy of the MPL was not distributed with this file, You can
 * obtain one at http://mozilla.org/MPL/2.0/.
 * 
 * This program comes with ABSOLUTELY NO WARRANTY.  See the Mozilla Public
 * License, v. 2.0 for more details.
 * 
 * Some questions about the license may have been answered at
 * https://www.mozilla.org/en-US/MPL/2.0/FAQ/.
 * 
 * If you have any question, contact me at boberle.com.
 * 
 * The source code can be found at boberle.com.
 *
 */

/*
 *
 * The sample text, "Le Laboureur et l'Aigle" from Aesop, has been dowloaded
 * from fr.wikisource.org
 * (https://fr.wikisource.org/wiki/Fables_d%E2%80%99%C3%89sope/Le_Laboureur_et_l%E2%80%99Aigle)
 * for the French version, and from en.wikisource.org for the English version.
 * It is distributed under the terms of the CC BY-SA-3.0 licence, which you
 * can find online
 * (https://creativecommons.org/licenses/by-sa/3.0/legalcode.fr) and is
 * reproduced in the file LICENSE_FOR_SAMPLE_TEXT.
 *
 */

/* TODO
      if (navigator.userAgent.search(/Win/i) != -1) {
         if (confirm("You are using Windows!  I will use Windows line-endings (rather than default Unix line-endings), unless you press Cancel.")) {
            result = result.replace(/\n/g, "\r\n");
         }
      }

 */

class DataLoader {

   /* @param go: empty, or 'withAnnotations' or 'withoutAnnotations' */
   constructor(callback, go) {
      this.callback = callback;
      var div = document.createElement('DIV');
      this.parseButton = undefined;
      this.hueStep = 25; // before _populateDiv
      this.saturationStep = 25; // before _populateDiv
      this.ligthnessStep = 10; // before _populateDiv
      this._populateDiv(div, go);
      div.style.padding = "10px";
      this.modalDiv = new ModalDiv("SACR - Coreference Chain Annotation Tool - " + VERSION, div, true);
      this.modalDiv.show();
      this.textFilename = "default";
      this.schema = "";
      this.text = "";
      this.showPropertyWarnings = false;
      this.minLinks = 2;
      this.tokenizationType = TOKENIZATION_CHARACTER;
   }

   _populateDiv(div, go) {
      var that = this;
      var t, p, ul, li, input;
      // use firefox
      p = document.createElement('P');
      div.appendChild(p);
      p.innerHTML = "Please use "
         + "<a href=\"http://firefox.com\" target=\"_blank\">Firefox</a>, "
         + "or at least "
         + "<a href=\"https://www.chromium.org/Home\" target=\"_blank\">Chromium</a> "
         + "or Google Chrome!";
      //p.style.color = 'red';
      p.style.fontStyle = 'italic';
      p = document.createElement('P');
      div.appendChild(p);
      p.innerHTML = "You will find a user guide "
         + "<a href=\"../user_guide.pdf\" target=\"_blank\">here</a>"
         + ", and some video tutorials (in French) "
         + "<a href=\"http://boberle.com/projects/sacr\" target=\"_blank\">here</a>"
         + ".";
      p.style.fontStyle = 'italic';
      div.appendChild(document.createElement('HR'));
      // text
      var textareaText = document.createElement('TEXTAREA');
      textareaText.cols = 90;
      textareaText.rows = 20;
      p = document.createElement('P');
      div.appendChild(p);
      p.innerHTML = "Write or paste the <b>text</b> in the text area below, or use one of these options:";
      ul = document.createElement('UL');
      p.appendChild(ul);
      li = document.createElement('LI');
      ul.appendChild(li);
      t = document.createTextNode("load a file: ");
      li.appendChild(t);
      var inputText = document.createElement('INPUT');
      li.appendChild(inputText);
      inputText.type = 'file';
      inputText.onchange = function () {
         var reader = new FileReader();
         reader.onload = function (e) {
            textareaText.value = e.target.result;
         };
         reader.readAsText(this.files[0]);
         that.textFilename = this.files[0].name;
      };
      li = document.createElement('LI');
      ul.appendChild(li);
      t = document.createTextNode("use a sample text: ");
      li.appendChild(t);

      var select = document.createElement('SELECT');
      var lst = new Array(
         "Please choose...",
         "en: Aesop (no annotation)",        // 1
         "en: Aesop (with annotations)",     // 2
         "en: Caesar (no annotation)",       // 3
         "en: Caesar (with annotations)",    // 4
         "en: Cicero (no annotation)",       // 5
         "en: Cicero (with annotations)",    // 6
         "en: Pliny (no annotation)",        // 7
         "en: Pliny (with annotations)",     // 8
         "fr: Esope (no annotation)",        // 9
         "fr: Esope (with annotations)",     // 10
         "fr: César (no annotation)",        // 11
         "fr: César (with annotations)",     // 12
         "fr: Cicéron (no annotation)",      // 13
         "fr: Cicéron (with annotations)",   // 14
         "fr: Pline (no annotation)",        // 15
         "fr: Pline (with annotations)",     // 16
      );
      for (var o of lst) {
         var opt = document.createElement('OPTION');
         opt.text = o;
         select.appendChild(opt);
      }
      li.appendChild(select);
      select.onchange = function () {
         var i = this.selectedIndex;
         var url = null;
         switch (i) {
            case 1: url = AESOP_EN_RAW; break;
            case 2: url = AESOP_EN_ANNOT; break;
            case 3: url = CAESAR_EN_RAW; break;
            case 4: url = CAESAR_EN_ANNOT; break;
            case 5: url = CICERO_EN_RAW; break;
            case 6: url = CICERO_EN_ANNOT; break;
            case 7: url = PLINY_EN_RAW; break;
            case 8: url = PLINY_EN_ANNOT; break;
            case 9: url = AESOP_FR_RAW; break;
            case 10: url = AESOP_FR_ANNOT; break;
            case 11: url = CAESAR_FR_RAW; break;
            case 12: url = CAESAR_FR_ANNOT; break;
            case 13: url = CICERO_FR_RAW; break;
            case 14: url = CICERO_FR_ANNOT; break;
            case 15: url = PLINY_FR_RAW; break;
            case 16: url = PLINY_FR_ANNOT; break;
         }
         var req = new XMLHttpRequest();
         req.addEventListener("load", function () {
            textareaText.value = this.responseText;
         });
         req.open("GET", window.location.href + "/txt/" + url);
         req.send();
      }
      div.appendChild(textareaText);

      // properties
      var textareaProperties = document.createElement('TEXTAREA');
      textareaProperties.cols = 90;
      textareaProperties.rows = 20;
      p = document.createElement('P');
      div.appendChild(p);
      p.innerHTML = "Write or paste the <b>properties</b> in the text area below, or use one of these options:";
      ul = document.createElement('UL');
      p.appendChild(ul);
      li = document.createElement('LI');
      ul.appendChild(li);
      t = document.createTextNode("load a file: ");
      li.appendChild(t);
      var inputSchema = document.createElement('INPUT');
      li.appendChild(inputSchema);
      inputSchema.type = 'file';
      inputSchema.onchange = function () {
         var reader = new FileReader();
         reader.onload = function (e) {
            textareaProperties.value = e.target.result;
         };
         reader.readAsText(this.files[0]);
      };
      li = document.createElement('LI');
      ul.appendChild(li);
      t = document.createTextNode("use a sample schema: ");
      li.appendChild(t);

      select = document.createElement('SELECT');
      lst = new Array(
         "Please choose...",
         "English scheme",
         "French scheme",
      );
      for (var o of lst) {
         var opt = document.createElement('OPTION');
         opt.text = o;
         select.appendChild(opt);
      }
      li.appendChild(select);
      select.onchange = function () {
         var i = this.selectedIndex;
         var url = null;
         switch (i) {
            case 1: url = SCHEME_EN; break;
            case 2: url = SCHEME_FR; break;
         }
         var req = new XMLHttpRequest();
         req.addEventListener("load", function () {
            textareaProperties.value = this.responseText;
         });
         req.open("GET", window.location.href + "/txt/" + url);
         req.send();
      }
      div.appendChild(textareaProperties);
      // number of link
      p = document.createElement('P');
      div.appendChild(p);
      p.innerHTML = "Enter the minimum number of links of a chain: ";
      input = document.createElement('INPUT');
      p.appendChild(input);
      input.type = 'number';
      input.min = '1';
      input.max = '50';
      input.value = '2';
      input.style.width = '70px'; // size attribute doesn't work for `number'
      input.onchange = function () {
         that.minLinks = this.value;
      };
      // number of colors
      p = document.createElement('P');
      div.appendChild(p);
      p.appendChild(document.createTextNode("You may want to tweak the number of colors, only if you need more colors: "));
      var colorSpan = document.createElement('SPAN');
      p.appendChild(colorSpan);
      var ul = document.createElement('UL');
      div.appendChild(ul);
      var li = document.createElement('LI');
      ul.appendChild(li)
      // hue
      li.appendChild(document.createTextNode("hue step: "));
      input = document.createElement('INPUT');
      li.appendChild(input);
      input.type = 'number';
      input.min = '10';
      input.max = '50';
      input.value = this.hueStep;
      input.style.width = '70px'; // size attribute doesn't work for `number'
      input.onchange = function () {
         that.hueStep = parseInt(this.value);
         colorSpan.innerHTML = "(" + that.computeNbOfColors().toString() + " colors)";
      };
      // saturation
      li.appendChild(document.createTextNode(" saturation step: "));
      input = document.createElement('INPUT');
      li.appendChild(input);
      input.type = 'number';
      input.min = '10';
      input.max = '50';
      input.value = this.saturationStep;
      input.style.width = '70px'; // size attribute doesn't work for `number'
      input.onchange = function () {
         that.saturationStep = parseInt(this.value);
         colorSpan.innerHTML = "(" + that.computeNbOfColors().toString() + " colors)";
      };
      // lightness
      li.appendChild(document.createTextNode(" lightness step: "));
      input = document.createElement('INPUT');
      li.appendChild(input);
      input.type = 'number';
      input.min = '5';
      input.max = '25';
      input.value = this.ligthnessStep;
      input.style.width = '70px'; // size attribute doesn't work for `number'
      input.onchange = function () {
         that.ligthnessStep = parseInt(this.value);
         colorSpan.innerHTML = "(" + that.computeNbOfColors().toString() + " colors)";
      };
      input.onchange();
      // tokenization type
      p = document.createElement('P');
      div.appendChild(p);
      p.innerHTML = "Choose the tokenization type: ";
      var select = document.createElement('SELECT');
      p.appendChild(select);
      for (var type of new Array('character', 'word', 'word and punctuation', 'manual')) {
         var option = document.createElement('OPTION');
         option.text = type;
         select.appendChild(option);
      }
      select.selectedIndex = 0; // default
      this.tokenizationType = TOKENIZATION_CHARACTER; // default
      select.onchange = function () {
         if (this.selectedIndex == 1) {
            that.tokenizationType = TOKENIZATION_WORD;
         } else if (this.selectedIndex == 2) {
            that.tokenizationType = TOKENIZATION_WORD_N_PUNCT;
         } else if (this.selectedIndex == 3) {
            that.tokenizationType = TOKENIZATION_MANUAL;
         } else {
            that.tokenizationType = TOKENIZATION_CHARACTER;
         }
      }
      // show property warnings
      p = document.createElement('P');
      div.appendChild(p);
      p.innerHTML = "Show property warnings: ";
      var checkPropertyWarnings = document.createElement('INPUT');
      checkPropertyWarnings.type = 'CHECKBOX';
      checkPropertyWarnings.checked = true;
      p.appendChild(checkPropertyWarnings);
      // parse the data
      p = document.createElement('P');
      div.appendChild(p);
      p.innerHTML = "Then click the button to ";
      input = document.createElement('INPUT');
      p.appendChild(input);
      input.type = 'button';
      input.value = "parse the data";
      input.onclick = function () {
         if (!textareaText.value) {
            alert("No text!");
         } else {
            // check if there is a tokenization type defined in the metadata
            // of the texte
            var tmp;
            if ((tmp = textareaText.value.match(/^\s*#\s*TOKENIZATION-TYPE\s*:\s*(\d)/mi)) != null) {
               if (parseInt(tmp[1]) != that.tokenizationType) {
                  alert("Tokenization type of the text doesn't match the value of the list box!");
                  return;
               }
            }
            that.schema = textareaProperties.value;
            that.text = textareaText.value;
            that.showPropertyWarnings = checkPropertyWarnings.checked;
            that.callback(that);
            that.modalDiv.close();
         }
      };
      this.parseButton = input;
      // license
      p = document.createElement('P');
      div.appendChild(p);
      p.innerHTML = "SACR -- (C) 2017 Bruno Oberlé. This program "
         + "is distributed under the terms of the <a href=\"http://mozilla.org/MPL/2.0/\">Mozilla Public License, v.2.0</a>. "
         + "This program comes with ABSOLUTELY NO WARRANTY, see the license for more details. "
         + "Source code may be found at boberle.com.";
   }

   computeNbOfColors() {
      return ColorBuilder.computeNbOfColors(this.hueStep, this.saturationStep,
         this.ligthnessStep);
   }

   clickOnTheParseButton() {
      this.parseButton.click();
   }
   static async fromURLSearchParams(url) {
      const textRes = await fetch(url.get("textUrl"));
      const schemaRes = await fetch(url.get("schemaUrl"));
      if (!textRes.ok)
         throw "Failed to load text " + url.get("textUrl");
      if (!schemaRes.ok)
         throw "Failed to load schema " + url.get("schemaUrl");
      var text = await textRes.text();
      var schema = await schemaRes.text();
      var dataLoader = {
         "tokenizationType": url.get("tokenizationType"),
         "text": text,
         "schema": schema,
         "hueStep": 25,
         "saturationStep": 25,
         "lightnessStep": 10,
         "minLinks": 2,
         "textFilename": url.get("textUrl").split("/").reverse()[0]
      };
      return dataLoader;
   }

   static async fromFileContent(fileContent, filename) {
      var text = fileContent;
      var schema = " ";
      var dataLoader = {
         "tokenizationType": TOKENIZATION_CHARACTER,
         "text": text,
         "schema": schema,
         "hueStep": 15,
         "saturationStep": 15,
         "lightnessStep": 10,
         "minLinks": 2,
         "textFilename": filename
      };
      return dataLoader;
   }
}


