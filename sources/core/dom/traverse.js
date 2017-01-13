export function findAncestorByPredicate(node, predicate) {

    for (node = node && node.parentNode; node; node = node.parentNode)
        if (predicate(node))
            return node;

    return null;

}

export function findAncestorsByPredicate(node, constructor) {

    let match = [];

    for (node = node && node.parentNode; node; node = node.parentNode)
        if (predicate(node))
            match.push(node);

    return match;

}

export function findDescendantByPredicate(node, predicate) {

    if (node) {

        let children = node.childNodes.slice();

        while (children.length > 0) {

            let child = children.shift();

            if (predicate(child))
                return child;

            children.splice(0, 0, ... child.childNodes);

        }

    }

    return null;

}

export function findDescendantsByPredicate(node, predicate) {

    let match = [];

    if (node) {

        let children = node.childNodes.slice();

        while (children.length > 0) {

            let child = children.shift();

            if (predicate(child))
                match.push(child);

            children.splice(0, 0, ... child.childNodes);

        }

    }

    return match;

}
