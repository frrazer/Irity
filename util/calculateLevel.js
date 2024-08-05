function calculateLevel(xp) {
    function f(x) {
        return 1.6667 * Math.pow(x, 3) + 22.5 * Math.pow(x, 2) + 75.8333 * x - xp;
    }

    function df(x) {
        return 5 * Math.pow(x, 2) + 45 * x + 75.8333;
    }

    let x0 = xp / 100;
    let x1 = x0 - f(x0) / df(x0);

    while (Math.abs(x1 - x0) > 0.0001) {
        x0 = x1;
        x1 = x0 - f(x0) / df(x0);
    }

    const currentLevel = Math.floor(x1);
    const nextLevel = currentLevel + 1;

    function xpForLevel(level) {
        return 1.6667 * Math.pow(level, 3) + 22.5 * Math.pow(level, 2) + 75.8333 * level;
    }

    const xpNextLevel = xpForLevel(nextLevel);
    const xpNeeded = xpNextLevel - xp;

    return {
        currentLevel: currentLevel,
        xpToNextLevel: xpNeeded
    };
}

module.exports = calculateLevel;
