export function getSpecificity(states) {

    let specificity = states.size;

    if (states.has(`decored`))
        specificity -= 1;

    return specificity;

}
