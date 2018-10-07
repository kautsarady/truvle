var quizes = require('./soal.json')

var shuffle = (words) => {
    let wordWithSpace = words + ' '
    let wordSplitted = wordWithSpace.split('')
    let final = ''
    for (let index = 0; index < wordSplitted.length; index++) {
        const element = wordSplitted[index];
        if(element === ' '){
                let word = wordSplitted.slice(final.length, index)
                for(let i = word.length - 1; i > 0; i--) {
                    let j = Math.floor(Math.random() * (i + 1));
                    let tmp = word[i];
                    word[i] = word[j];
                    word[j] = tmp;
                }
                final = final + word.join('') + ' '    
        }
    }
    return final.slice(0, final.length-1)
}

module.exports = {
    getRandomQuiz:() => {
        var randomQuizIndex = Math.floor(Math.random() * quizes.length)
        quizes[randomQuizIndex].shuffledWord = shuffle(quizes[randomQuizIndex].word)
        return quizes[randomQuizIndex]
    }    
} 