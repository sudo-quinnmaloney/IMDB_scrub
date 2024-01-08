
const httpGet = (theUrl) => {
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.open( "GET", theUrl, false ); // false for synchronous request
    xmlHttp.send( null );
    return JSON.parse(xmlHttp.responseText);
}

const httpGetAsync = (theUrl, callback) => {
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.onreadystatechange = function() { 
        if (xmlHttp.readyState == 4 && xmlHttp.status == 200)
            callback(xmlHttp.responseText);
    }
    xmlHttp.open("GET", theUrl, true); // true for asynchronous 
    xmlHttp.send(null);
}

const setElementHeight = (element, height) => {
    try {
        element.style.height = height;
    } catch (error) {
        console.error("[ setElementHeight() ] ", error);
        throw error;
    }
};

const initSuggestions = (input, suggestionList, suggestions, e) => {
    if (suggestionList.querySelectorAll('.suggestion').length == 0) {
        updateSuggestions(input, suggestionList, suggestions, e);
    }
};

const updateSuggestions = (input, suggestionList, suggestions, e) => {
    try {
        if (e.key && e.key.startsWith('Arrow')) {
            return;
        }
        if (!e.key) {
            const suggestions = suggestionList.querySelectorAll('.suggestion');
            suggestions.forEach((suggestion) => {handleSuggestionSubmit(suggestion, input, suggestionList)});
        }
        const value = input.value;
        const filteredSuggestions = suggestions.filter((suggestion) => suggestion.toLowerCase().startsWith(value.toLowerCase()));
        suggestionList.innerHTML = filteredSuggestions.map((suggestion) => `<li class="suggestion">${suggestion}</li>`).join('');

        const filteredSugs = document.querySelectorAll(".suggestion");

        filteredSugs.forEach((suggestion) => {
            suggestion.addEventListener("mouseenter", () => {
                const suggestions = suggestionList.querySelectorAll('.suggestion');
                suggestions.forEach((suggestion) => {handleSuggestionLeave(suggestion)});
                handleSuggestionHover(suggestion);
            });
            suggestion.addEventListener("mouseleave", () => handleSuggestionLeave(suggestion));
            suggestion.addEventListener("mousedown", () => handleSuggestionClick(suggestion, input, suggestionList));
        });
    } catch (error) {
        console.error("[ updateSuggestions() ] ", error);
        throw error;
    }
};

const clearSuggestions = (suggestionList) => {
    try {
        suggestionList.innerHTML = "";
    } catch (error) {
        console.error("[ clearSuggestions() ] ", error);
        throw error;
    }
};

const handleEnterKey = (e, input, suggestionList) => {
    try {
        // TODO: check if anything is hovered
        //       if hovered, fill input value and clear suggs
        //       else submit the query
        if (e.keyCode === 13) {
            input.blur();
            renderResults(input);
            clearSuggestions(suggestionList);
            input.value = "";
        }
    } catch (error) {
        console.error("[ handleEnterKey() ] ", error);
        throw error;
    }
};

const renderResults = (input) => {
    try {
        // TODO: recognize if nested jsons, load appropriately
        const resultsDiv = document.getElementById('resultsDiv');
        const resultsKey = document.getElementById('resultsKey');
        const results = document.getElementById('results');
        const searchTrace = document.getElementById('searchTrace');

        results.innerHTML = apiResponse[input.value];
        resultsKey.innerHTML = input.value;
        if (!searchTrace.innerText) {
            searchTrace.innerText = input.value;
        } else {
            searchTrace.innerText = searchTrace.innerText + '>' + input.value;
        }
    } catch (error) {
        console.error("[ renderResults() ] ", error);
    }
}

const handleSuggestionClick = (suggestion, input, suggestionList) => {
    try {
        input.value = suggestion.innerHTML;
        input.blur();
        renderResults(input);
        clearSuggestions(suggestionList);
        input.value = "";
    } catch (error) {
        console.error("[ handleSuggestionClick() ] ", error);
        throw error;
    }
};

const handleSuggestionSubmit = (suggestion, input, suggestionList) => {
    try {
        if (!suggestion.classList.contains("hoveredSuggestion")) {
            return;
        }
        handleSuggestionClick(suggestion, input, suggestionList)
    } catch (error) {
        console.error("[ handleSuggestionSubmit() ] ", error);
        throw error;
    }
}

const handleSuggestionHover = (suggestion) => {
    try {
        suggestion.classList.add("hoveredSuggestion");
    } catch (error) {
        console.error("[ handleSuggestionHover() ] ", error);
        throw error;
    }
};

const handleSuggestionLeave = (suggestion) => {
    try {
        suggestion.classList.remove("hoveredSuggestion");
    } catch (error) {
        console.error("[ handleSuggestionLeave() ] ", error);
        throw error;
    }
};

const handleArrowKey = (e, input, suggestionList) => {
    try {
        const suggestions = suggestionList.querySelectorAll('.suggestion');
        let currentIndex = Array.from(suggestions).findIndex(suggestion => suggestion.classList.contains('hoveredSuggestion'));
        if (e.key === 'ArrowUp' && currentIndex <= 0) {
            e.preventDefault();
            suggestions[0].classList.remove('hoveredSuggestion');
            input.value = pre_suggest;
            return;
        }
        if (e.key === 'ArrowDown' && currentIndex == -1) {
            pre_suggest = input.value;
        }

        if (e.key === 'ArrowUp') {
            e.preventDefault();
            currentIndex = (currentIndex - 1 + suggestions.length) % suggestions.length;
        } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            currentIndex = (currentIndex + 1) % suggestions.length;
        }
        
        suggestions.forEach((suggestion, index) => {
            if (index === currentIndex && e.key.startsWith('Arrow')) {
                input.value = suggestion.innerHTML;
                suggestion.classList.add('hoveredSuggestion');
            } else {
                suggestion.classList.remove('hoveredSuggestion');
            }
        });
    } catch (error) {
        console.error("[ handleArrowKey() ] ", error);
        throw error;
    }
};

try {
    var pre_suggest = "";
    var apiResponse = {};
    var movieCode = "";
    var suggestions = [];

    // TODO: if /title/, query cast, writers, directors, and start suggestions from there (project info already available)
    // TODO: otherwise if /name/, query known projects for connections (avoid duplicates)
    chrome.tabs.query({active: true, currentWindow: true}, tabs => {
        let url = tabs[0].url;
        console.log(url);
        if (url.startsWith('https://www.imdb.com/title/')) {
            let splitUrl = url.split('\/'); 
            movieCode = splitUrl[splitUrl.length - 2];
            apiResponse = httpGet(`http://www.omdbapi.com/?i=${movieCode}&apikey=842ad378`);
            suggestions = Object.keys(apiResponse);
        } else if (url.startsWith('https://www.imdb.com/name/')) {
            let splitUrl = url.split('\/');
            personCode = splitUrl[splitUrl.length - 2];
            apiResponse = null;
            alert('Search on profiles not implemented :(');
        } else {
            apiResponse = null;
            alert('Must begin search with an IMDB page open as reference.');
        }
        if (!apiResponse) {
            window.close();
        }
    });

    const input = document.getElementById('searchbar');
    const suggestionList = document.getElementById('suggestionList');
    const searchTrace = document.getElementById('searchTrace');
    const copyButton = document.getElementById('copyButton');
    setElementHeight(document.documentElement, "35rem");

    copyButton.addEventListener('mousedown', (e) => toClipboard(searchTrace.innerText));
    input.addEventListener('keyup', (e) => updateSuggestions(input, suggestionList, suggestions, e));
    input.addEventListener('mousedown', (e) => initSuggestions(input, suggestionList, suggestions, e));
    input.addEventListener('keydown', (e) => {
        handleEnterKey(e, input, suggestionList);
        handleArrowKey(e, input, suggestionList);
    });

    window.addEventListener('mousedown', () => clearSuggestions(suggestionList), true);
} catch (error) {
    console.error("Main try block error:", error);
}

function toClipboard(text) {
    //Inject a temporary field where "copy [text]" command can be executed
    //Append the textbox field into the body as a child. 
    //"execCommand()" only works when there exists selected text, and the text is inside
    //document.body (meaning the text is part of a valid rendered HTML element).
    // TODO: address deprecated execCommand()
    var copyFrom = document.createElement("textarea");
    copyFrom.textContent = text;
    document.body.appendChild(copyFrom);
    copyFrom.select();
    document.execCommand('copy'); 
    copyFrom.blur();
    document.body.removeChild(copyFrom);

    alert("Copied to clipboard!");
  }

// TODO: trace all clicked suggestions: Dinero(Blue Bloods)>Mathers(Rick & Morty)>Lamar
// TODO: update suggestion set when search is submitted (should really be a connection set, which stores the person and the related project)
// TODO: initialize suggestion set with API request using url as starting point (or text on page if necessary?)
// TODO: when person selected, toggle project view or person view (suggestions are always people connected to people though)
// TODO: replace clipboard success alert() with a more subtle visual confirmation (checkmark)
// TODO: cache previous queries, if loop occurs fall back to previous node
// TODO: shift to imdb api :(
// TODO: style options page