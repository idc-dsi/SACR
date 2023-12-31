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

/* Issues with stylesheets.  You can specify a <link rel="style.css">
 * thing with JS, but you need a absolute path for href.
 *    var link = this.win.document.createElement("LINK");
 *    link.href = "file:///foo/bar/style.css";
 *    link.type = "text/css";
 *    link.rel = "stylesheet";
 *    this.win.document.head.appendChild(link)
 * Otherwise, you need to use the document.stylesheets objects, which
 * list all the style sheets.  But by default, there is none.  To
 * create one, use:
 *    var styleElement = win.document.createElement('style');
 *    win.document.head.appendChild(styleElement);
 * Now, you have a stylesheet that you can get:
 *    var styleSheet = win.document.styleSheets[0];
 * or
 *    var styleSheet = styleElement.styleSheet
 * Then use can set the text:
 *    styleSheet.cssText = "you text"
 * or
 *    stylesheet.insertRule('p.linkParagraph { padding-left: 15px; }',
 *    index);
 * Note that in the last example, you need to specify an index (the
 * last one if you want the rule to be inserted at the end of the
 * stylesheet: use something with nextIndex++).
 */



class ChainPopup {

   constructor(chainDiv) {
      this.visible = false;
      this.chainDiv = chainDiv;
      // the window
      this.win = undefined;
      this.winWidth = '350';
      this.winHeight = '400';
      this.winTop = '100';
      this.winLeft = '100';
      // the elements
      this.h1 = document.createElement('H1');
      this.h1.appendChild(document.createTextNode('Chains and Links'));
      this.body = document.createElement('div');
      document.getElementById('popupContainer').appendChild(this.body);

      var filterContainer = document.createElement('div');
      filterContainer.id = "popupFilterContainer";
      this.filterBox = document.createElement("input");
      this.filterBox.id = "popupFilter";
      this.filterBox.type = "text";
      var that = this;
      this.filterBox.onchange = function (e) {
         if (e.keyCode === 27)
            that.filterBox.blur();
         else
            that.filter(that.filterBox.value);
      };
      this.filterBox.oninput = this.filterBox.onchange;
      this.filterBox.onkeydown = this.filterBox.onchange;
      this.filterBox.onpaste = this.filterBox.onchange;
      filterContainer.appendChild(this.filterBox);

      this.body.appendChild(this.h1);
      this.body.appendChild(filterContainer);
      this.body.appendChild(chainDiv);
   }

   show() {
      this.visible = true;
      this.body.parentNode.style.display = "block";
      gText.chainColl.sortChainsAndUpdatePopupDiv();
   }
   hide() {
      this.visible = false;
      this.body.parentNode.style.display = "none";
   }
   filter(pattern) {
      for (var chain of this.chainDiv.childNodes) {
         chain.style.display = (chain.innerText.indexOf(pattern) != -1) ? "block" : "none";
      }
   }
   toggle() {
      if (this.visible)
         this.hide();
      else
         this.show();
   }

};

