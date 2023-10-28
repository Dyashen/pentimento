function convertPTag(pTag, count) {
    let text = pTag.textContent;
    let words = text.split(' ');
    let container = document.createElement('div');
    container.className = '_' + String(count) + '_text_block';
    
    for (let word of words) {
      let span = document.createElement('span');
      span.textContent = word + ' ';
      container.appendChild(span);
    }
    
    pTag.parentNode.replaceChild(container, pTag);
  }

  window.addEventListener('load', function() {
    let pTagsLeft = document.querySelectorAll('.article-left p');
    let countLeft = 0;
  
    for (let pTag of pTagsLeft) {
      convertPTag(pTag, countLeft);
      countLeft++;
    }

    let pTagsRight = document.querySelectorAll('.article-right p');
    let countRight = 0;
  
    for (let pTag of pTagsRight) {
      convertPTag(pTag, countRight);
      countRight++;
    }
  });

window.onload = function() {

  /*
    Woorden uit woordenlijst onderlijnen
  */
    Object.keys(localStorage).forEach(function(key) {
      const spans = document.getElementsByTagName('span');
      for (let i = 0; i < spans.length; i++) {
          const span = spans[i];
          if (span.innerText === key) {
            span.className = 'markedWord'
          }
      }
    });

  /*
    Woord + definities tonen
  */
    const markedWords = document.querySelectorAll('.markedWord');
    markedWords.forEach(word => {
        word.addEventListener('click', () => {
            alert(word);
        });
    });
    

  async function addToLocalstorage(event, definition) {
    const key = event.target.innerHTML;    
    const existingValue = localStorage.getItem(key);

    if (existingValue) {
        const definitions = JSON.parse(existingValue);
        definitions.push(definition);
        localStorage.setItem(key, JSON.stringify(definitions));
    } else {
        localStorage.setItem(key, definition);
    }
  }

  function showPentimento(event, value){
    alert(
      String(event.target.innerHTML) + ' ' + String(value)
    )
  }

  /*
    GPT-3 API hier toevoegen
  */
  async function getDefinition(event) {
    const response = await fetch(`http://localhost:5000/get-definition`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ word: event.target.innerText, sentence: event.target.innerText }),
    });
    
    result = await response.json();
    console.log(result.simplified);
    return result.simplified;
  }

  async function lookInLocalstorage(event){
    const key = event.target.innerHTML;
    const value = localStorage.getItem(key);
    const definition = await getDefinition(event);
    addToLocalstorage(event, definition);
    showPentimento(event, definition);
  }

  const spanElements = document.querySelectorAll('span');
  spanElements.forEach(span => {
      span.addEventListener('click', lookInLocalstorage);
  });


  function getStartAndEnd(startContainer, endContainer){
    let startDiv = startContainer;
    while (startDiv && startDiv.nodeName !== 'DIV') {
      startDiv = startDiv.parentNode;
    }
    
    let endDiv = endContainer;
    while (endDiv && endDiv.nodeName !== 'DIV') {
        endDiv = endDiv.parentNode;
    }

    return([startDiv, endDiv]);
  }

  async function getRewrittenText(type, text, startRange){
    const response = await fetch(`http://localhost:5000/get-simplification`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: type, text: text }),
    });
    
    result = await response.json();
    console.log(result.simplified);

    const rightArticle = document.querySelector('.article-right');
    var childElements = rightArticle.querySelectorAll('.' + startRange.className);
    childElements[0].innerText = result.simplified;
    
    return;
  }

  /*
    Woordenboek tonen of verbergen
  */
    const showDictionaryButton = document.querySelector('.show');
    const stopShowingDictionaryButton = document.querySelector('.dontShow');
    if(showDictionaryButton){
      showDictionaryButton.addEventListener('click', () => {
        const table = document.createElement('table');
        const tbody = document.createElement('tbody');
        table.appendChild(tbody);
        

        /*
          Alfabetische sortering
        */
        const sortedKeys = Object.keys(localStorage).sort();
        for (let i = 0; i < sortedKeys.length; i++) {
            const tr = document.createElement('tr');
            const key = sortedKeys[i];
            const value = localStorage.getItem(key);
            const td1 = document.createElement('td');
            td1.textContent = key;
            tr.appendChild(td1);
            const td2 = document.createElement('td');
            td2.textContent = value;
            tr.appendChild(td2);
            tbody.appendChild(tr);
        }

        table.className = 'dictionary'
        
        const firstContainer = document.querySelector('.container');
        document.body.insertBefore(table, firstContainer);
        showDictionaryButton.style.display = 'none';
        stopShowingDictionaryButton.style.display = 'inline'
      })
    }
    
    
    if(stopShowingDictionaryButton){
      stopShowingDictionaryButton.addEventListener('click', () => {
        const table = document.querySelector('.dictionary');
        table.remove();
        showDictionaryButton.style.display = 'inline';
        stopShowingDictionaryButton.style.display = 'none';
      })
    }
    
  /*
    Gemarkeerde tekst herschrijven
  */
  const rewriteButton = document.querySelector('.rewrite');
  rewriteButton.addEventListener('click', () => {
    const selection = window.getSelection();
    if (selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        const startContainer = range.startContainer;
        const endContainer = range.endContainer;

        var parentDiv = document.querySelector('.article-left');

        const rangeDivs = getStartAndEnd(startContainer, endContainer)
        const startRange = rangeDivs[0]

        if(!parentDiv.contains(startRange)){
          alert("Hier kan je geen tekst markeren. Markeer tekst in de linkerzijde van de pagina.");
          return
        }

        const typeVereenvoudiging = prompt('Hoe wil je de tekst vereenvoudigen?\n Kies uit: opsomming, tabel, doorlopende tekst.');
        if (!['opsomming','tabel','doorlopend'].includes(typeVereenvoudiging)){
          alert('Geef een geldige vereenvoudigingstechniek mee!');
          return;
        }

        const endRange = rangeDivs[1]
        const int_text = startRange.innerText + endRange.innerText;

        getRewrittenText(typeVereenvoudiging, int_text, startRange); 
    }
  });
};


/*
  Webpagina doorsturen
*/
async function sendHTMLPageToBackend(){
  var articleRightElement = document.querySelector('.article-right');
  var serializer = new XMLSerializer();
  var htmlString = serializer.serializeToString(articleRightElement);
  console.log(htmlString);
  var url = 'http://localhost:5000/convert-to-word';
  var response = await fetch(url, {
      method: 'POST',
      headers: {
          'Content-Type': 'application/json'
      },
      body: JSON.stringify({
          html: htmlString
      })
  });

  if(response.ok) {
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const tempLink = document.createElement('a');
      tempLink.href = blobUrl;
      tempLink.setAttribute('download', 'file.zip');
      tempLink.click();
  } else {
      // console.error('Server responded with', response.status);
      alert('Server responded with ' + String(response.status))
  }
}
