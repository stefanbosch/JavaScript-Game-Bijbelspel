document.getElementById('current-year').textContent = new Date().getFullYear();

const otBooks = ['Genesis','Exodus','Leviticus','Numeri','Deuteronomium','Jozua','Rechters','Ruth','1 Samuel','2 Samuel','1 Koningen','2 Koningen','1 Kronieken','2 Kronieken','Ezra','Nehemia','Ester','Job','Psalmen','Spreuken','Prediker','Hooglied','Jesaja','Jeremia','Klaagliederen','Ezechiël','Daniël','Hosea','Joël','Amos','Obadja','Jona','Micha','Nahum','Habakuk','Sefanja','Haggai','Zacharia','Maleachi'];
const ntBooks = ['Matteüs','Marcus','Lucas','Johannes','Handelingen','Romeinen','1 Korintiërs','2 Korintiërs','Galaten','Efeziers','Filippenzen','Kolossenzen','1 Tessalonicenzen','2 Tessalonicenzen','1 Timoteüs','2 Timoteüs','Titus','Filemon','Hebreeën','Jakobus','1 Petrus','2 Petrus','1 Johannes','2 Johannes','3 Johannes','Judas','Openbaring van Jezus'];

let currentGame;
let errorCount = 0;
let correctCount = 0; // Nieuw variabele voor het aantal juiste antwoorden

// Timer logica
let startTime;
let timerInterval;

function startTimer() {
    startTime = new Date().getTime();
    timerInterval = setInterval(updateTimer, 1000);
}

function updateTimer() {
    const now = new Date().getTime();
    const timeDifference = Math.floor((now - startTime) / 1000);

    const minutes = Math.floor(timeDifference / 60);
    const seconds = timeDifference % 60;

    document.getElementById('timer').textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function stopTimer() {
    clearInterval(timerInterval);
    document.getElementById('timer').textContent = '00:00';
}

// Gouden Tip Logica
function toggleGoldenTip() {
    if (!currentGame) return;

    const tipBox = document.getElementById('golden-tip-box');
    const tipText = document.getElementById('golden-tip-text');

    // Als de tip al open staat, klik = verbergen
    if (!tipBox.classList.contains('d-none')) {
        tipBox.classList.add('d-none');
        return;
    }

    const nextIndex = currentGame.answerArray.length;
    if (nextIndex < currentGame.fullArray.length) {
        const nextBookName = currentGame.fullArray[nextIndex];
        const info = (typeof bookData !== 'undefined' && bookData[nextBookName]) 
            ? bookData[nextBookName].summary 
            : 'Geen omschrijving gevonden voor dit boek.';
        tipText.textContent = info;
        tipBox.classList.remove('d-none');
    } else {
        tipText.textContent = "Je hebt alle boeken al gevonden!";
        tipBox.classList.remove('d-none');
    }
}

function hideGoldenTip() {
    const tipBox = document.getElementById('golden-tip-box');
    if (tipBox) {
        tipBox.classList.add('d-none');
    }
}

// Search Logic
const searchInput = document.getElementById('book-search');
const suggestionsBox = document.getElementById('search-suggestions');
let activeSuggestionIndex = -1;

searchInput.addEventListener('input', function() {
    const query = this.value.toLowerCase().trim();
    if (!query || !currentGame) {
        suggestionsBox.style.display = 'none';
        return;
    }

    const filtered = currentGame.fullArray.filter(book => 
        book.toLowerCase().includes(query) && 
        !currentGame.answerArray.includes(book)
    );

    if (filtered.length > 0) {
        suggestionsBox.innerHTML = filtered.map((book, index) => 
            `<div class="suggestion-item" onclick="selectSuggestion('${book}')">${book}</div>`
        ).join(' ');
        suggestionsBox.style.display = 'block';
    } else {
        suggestionsBox.style.display = 'none';
    }
    activeSuggestionIndex = -1;
});

searchInput.addEventListener('keydown', function(e) {
    const items = suggestionsBox.querySelectorAll('.suggestion-item');
    if (e.key === 'ArrowDown') {
        activeSuggestionIndex = Math.min(activeSuggestionIndex + 1, items.length - 1);
        updateActiveSuggestion(items);
        e.preventDefault();
    } else if (e.key === 'ArrowUp') {
        activeSuggestionIndex = Math.max(activeSuggestionIndex - 1, -1);
        updateActiveSuggestion(items);
        e.preventDefault();
    } else if (e.key === 'Enter') {
        if (activeSuggestionIndex > -1) {
            selectSuggestion(items[activeSuggestionIndex].textContent);
        } else if (items.length > 0) {
            selectSuggestion(items[0].textContent);
        }
    }
});

function updateActiveSuggestion(items) {
    items.forEach((item, index) => {
        item.classList.toggle('active', index === activeSuggestionIndex);
        if (index === activeSuggestionIndex) item.scrollIntoView({ block: 'nearest' });
    });
}

function selectSuggestion(bookName) {
    if (currentGame) {
        currentGame.doAnswer(bookName);
        searchInput.value = '';
        suggestionsBox.style.display = 'none';
        searchInput.focus();
    }
}

// Close suggestions when clicking outside
document.addEventListener('click', (e) => {
    if (!searchInput.contains(e.target) && !suggestionsBox.contains(e.target)) {
        suggestionsBox.style.display = 'none';
    }
});

function showSelection() {
    hideGoldenTip();
    document.getElementById('selection-screen').style.display = 'block';
    document.getElementById('game-ui').style.display = 'none';
    currentGame.stopTimer();
}

function startGame(mode) {
    hideGoldenTip();
    let books = [];
    let label = "";
    if (mode === 'OT') { books = otBooks; label = "Oude Testament"; }
    else if (mode === 'NT') { books = ntBooks; label = "Nieuwe Testament"; }
    else { books = otBooks.concat(ntBooks); label = "Hele Bijbel"; }

    document.getElementById('selection-screen').style.display = 'none';
    document.getElementById('game-ui').style.display = 'block';
    document.getElementById('game-mode-label').textContent = label;
    
    currentGame = new BibleGame(books, "canvas");

    currentGame.startTimer();
}

function BibleGame(bookArray, canvasId) {
    this.fullArray = bookArray;
    this.answerArray = [];
    this.canvasId = canvasId;
    errorCount = 0;
    correctCount = 0;
    document.getElementById('error-count').textContent = "0";
    document.getElementById('correct-count').textContent = "0";
    document.getElementById('last-correct-book').textContent = "";

    this.randomize = function(arr) {
        return [...arr].sort(() => Math.random() - 0.5);
    };

    this.toggleFlip = function(event, bookName) {
        event.stopPropagation();
        const card = document.getElementById('card_' + bookName);
        card.classList.toggle('is-flipped');
    };

    this.doAnswer = function(bookName) {
        const card = document.getElementById('card_' + bookName);
        if (card.classList.contains('is-correct')) return;
        if (card.classList.contains('is-flipped')) return;

        const expectedBook = this.fullArray[this.answerArray.length];

        if (bookName === expectedBook) {
            this.answerArray.push(bookName);
            hideGoldenTip(); // Verberg de gouden tip weer als het juiste boek is geklikt
                                card.classList.add('is-correct');
            const posBadge = card.querySelector('.pos-badge');
            posBadge.textContent = this.answerArray.length;
            
            this.showThumbsUp();
            correctCount++; // Juist antwoord verhogen

            document.getElementById('correct-count').textContent = correctCount; // Update de weergave van juiste antwoorden

            const lastCorrectBookElement = document.getElementById('last-correct-book');
            lastCorrectBookElement.textContent = `${bookName}`;
            lastCorrectBookElement.innerHTML += '<i class="bi bi-check-circle-fill ms-1"></i>';

            const canvas = document.getElementById(this.canvasId);
            card.classList.add('fade-out'); // Add fade-out class for the current card
            setTimeout(() => {
                canvas.appendChild(card); // Append the card to the canvas at its new position
                card.classList.remove('fade-out', 'is-flipped'); // Remove classes after appending and flipping
                card.classList.add('fade-in'); // Add fade-in class for the updated card
                setTimeout(() => {
                    card.classList.remove('fade-in'); // Remove the fade-in class once the animation is complete
                }, 1500);
            }, 1500); // Delay the appending of the card by 500ms to allow the fade-out animation to complete

            if (this.answerArray.length === this.fullArray.length) {
                setTimeout(() => alert("Gefeliciteerd! Je hebt alle boeken gevonden met " + errorCount + " fouten. " + document.getElementById('timer').textContent ), 500);
                this.stopTimer();
            }
        } else {
            errorCount++;
            const errorBadge = document.getElementById('error-count');
            errorBadge.textContent = errorCount;

            // Schud-animatie triggeren
            errorBadge.classList.remove('shake');
            void errorBadge.offsetWidth; // Forceer herberekening van de browser layout (reflow) zodat de animatie altijd opnieuw start
            errorBadge.classList.add('shake');
                
            this.flashError(card);

            this.showThumbsDown();
        }
    };

            this.flashError = function(card) {
        const inner = card.querySelector('.card-front');
        inner.style.backgroundColor = "#f8d7da";
        setTimeout(() => {
            if (!card.classList.contains('is-correct')) {
                inner.style.backgroundColor = "white";
            }
        }, 300);
    };

    this.showThumbsUp = function() {
        const searchInput = document.getElementById('book-search');
        const container = searchInput.parentElement;
        
        const thumbsUp = document.createElement('i');
        thumbsUp.className = 'bi bi-hand-thumbs-up-fill thumbs-up-animation';
        container.appendChild(thumbsUp);
        
        // Verwijder het element na de animatie om de DOM schoon te houden
        setTimeout(() => {
            thumbsUp.remove();
        }, 1000);
    };

    this.showThumbsDown = function() {
        const searchInput = document.getElementById('book-search');
        const container = searchInput.parentElement;
        
        const thumbsDown = document.createElement('i');
        thumbsDown.className = 'bi bi-hand-thumbs-down-fill thumbs-up-animation';
        thumbsDown.style.color = 'red'; // Change the color to red
        container.appendChild(thumbsDown);
        
        // Remove the element after the animation to keep the DOM clean
        setTimeout(() => {
            thumbsDown.remove();
        }, 1000);
    };

    this.startTimer = function() {
    startTimer();
    };

    this.stopTimer = function() {
        stopTimer();
    };

    this.draw = function() {
        const canvas = document.getElementById(this.canvasId);
        canvas.innerHTML = "";
        const randomized = this.randomize(this.fullArray);

        randomized.forEach(book => {
            const info = bookData[book] || { summary: 'Een boek van de Bijbel.', people: 'Diverse personen' };
            const cardMarkup = `
                <div class="bible-card" id="card_${book}" onclick="currentGame.doAnswer('${book}')">
                    <div class="card-inner">
                        <div class="card-front">
                            <div class="pos-badge"></div>
                            <div class="fw-bold text-center" style="font-size: 1.1rem;">${book}</div>
                            <div class="info-btn" onclick="currentGame.toggleFlip(event, '${book}')">
                                <i class="bi bi-info-circle"></i>
                            </div>
                        </div>
                        <div class="card-back">
                            <div class="small fw-bold mb-1">${book}</div>
                            <div class="mb-2" style="font-size: 0.75rem;">${info.summary}</div>
                            <div class="fst-italic text-warning" style="font-size: 0.7rem;">Wie: ${info.people}</div>
                            <div class="mt-auto" onclick="currentGame.toggleFlip(event, '${book}')">
                                <i class="bi bi-arrow-left-circle"></i> terug
                            </div>
                        </div>
                    </div>
                </div>
            `;
            canvas.innerHTML += cardMarkup;
        });
    };

    this.draw();
}