export const HARDCODED_PROBLEMS = [
    {
        id: "cf-4a",
        title: "Watermelon",
        description: `One hot summer day Pete and his friend Billy decided to buy a watermelon. They chose the biggest and the ripest one, in their opinion. After that the watermelon was weighed, and the scales showed w kilos. They rushed home, dying of thirst, and decided to divide the berry, however they faced a hard problem.

Pete and Billy are great fans of even numbers, that's why they want to divide the watermelon in such a way that each of the two parts weighs even number of kilos, at the same time it is not obligatory that the parts are equal. The boys are extremely tired and want to start their meal as soon as possible, that's why you should help them and find out, if they can divide the watermelon in the way they want. For sure, each of them should get a part of positive weight.`,
        constraints: "1 ≤ w ≤ 100",
        sampleTests: [
            { input: "8", expectedOutput: "YES" },
            { input: "2", expectedOutput: "NO" },
            { input: "4", expectedOutput: "YES" },
        ],
        rating: 800,
    },
    {
        id: "cf-1a",
        title: "Theatre Square",
        description: `Theatre Square in the capital city of Berland has a rectangular shape with the size n × m meters. On the occasion of the city's anniversary, a decision was taken to pave the Square with square granite flagstones. Each flagstone is of the size a × a.

What is the least number of flagstones needed to pave the Square? It's allowed to cover the surface larger than the Theatre Square, but the Square has to be covered. It's not allowed to break the flagstones. The sides of flagstones should be parallel to the sides of the Square.`,
        constraints: "1 ≤ n, m, a ≤ 10^9",
        sampleTests: [
            { input: "6 6 4", expectedOutput: "4" },
            { input: "1 1 1", expectedOutput: "1" },
        ],
        rating: 1000,
    },
    {
        id: "cf-71a",
        title: "Way Too Long Words",
        description: `Sometimes some words like "localization" or "internationalization" are so long that writing them many times in one text is quite tiresome.

Let's consider a word too long, if its length is strictly more than 10 characters. All too long words should be replaced with a special abbreviation.

This abbreviation is made like this: we write down the first and the last letter of a word and between them we write the number of letters between the first and the last letters. That number is in decimal system and doesn't contain any leading zeroes.

Thus, "localization" will be spelt as "l10n", and "internationalization" will be spelt as "i18n".`,
        constraints: "1 ≤ n ≤ 100, each word length ≤ 100",
        sampleTests: [
            { input: "4\nword\nlocalization\ninternationalization\npneumonoultramicroscopicsilicovolcanoconiosis", expectedOutput: "word\nl10n\ni18n\np43s" },
        ],
        rating: 800,
    },
    {
        id: "cf-231a",
        title: "Team",
        description: `One day three best friends Petya, Vasya and Tonya decided to form a team and take part in programming contests. Participants are usually offered several problems during programming contests. Long before the start the friends decided that they will implement a problem if at least 2 of them are sure about the solution.

The contest offers n problems. For each problem we know which friend is sure about the solution. Help the friends find the number of problems for which they will write a solution.`,
        constraints: "1 ≤ n ≤ 1000",
        sampleTests: [
            { input: "3\n1 1 0\n1 1 1\n1 0 0", expectedOutput: "2" },
        ],
        rating: 800,
    },
    {
        id: "cf-158a",
        title: "Next Round",
        description: `"Contestant who earns a score equal to or greater than the k-th place finisher's score will advance to the next round." Find how many contestants advance.`,
        constraints: "1 ≤ k ≤ n ≤ 50",
        sampleTests: [
            { input: "8 5\n10 9 8 7 7 7 5 5", expectedOutput: "6" },
            { input: "4 2\n0 0 0 0", expectedOutput: "0" },
        ],
        rating: 800,
    },
    {
        id: "cf-118a",
        title: "String Task",
        description: `Petya started to attend programming lessons. His first task is to write a program that: 1) deletes all vowels, 2) inserts a character "." before each consonant, 3) replaces all uppercase consonants with corresponding lowercase ones.`,
        constraints: "1 ≤ length ≤ 100",
        sampleTests: [
            { input: "tour", expectedOutput: ".t.r" },
            { input: "Codeforces", expectedOutput: ".c.d.f.r.c.s" },
        ],
        rating: 1000,
    },
    {
        id: "cf-50a",
        title: "Domino Piling",
        description: `You are given a rectangular board of M × N squares. Also you are given an unlimited number of standard domino pieces of 2 × 1 squares. You are allowed to rotate the pieces. Find the maximum number of dominoes which can be placed.`,
        constraints: "1 ≤ M, N ≤ 16",
        sampleTests: [
            { input: "2 4", expectedOutput: "4" },
            { input: "3 3", expectedOutput: "4" },
        ],
        rating: 800,
    },
    {
        id: "cf-282a",
        title: "Bit++",
        description: `The classic programming language of Bitland is Bit++. The language has two variables: x and y. The statement "++x" and "x++" both increase x by 1. "--x" and "x--" both decrease x by 1. Given a program in Bit++, find the final value of x.`,
        constraints: "1 ≤ n ≤ 150",
        sampleTests: [
            { input: "1\n++X", expectedOutput: "1" },
            { input: "2\nX++\n--X", expectedOutput: "0" },
        ],
        rating: 800,
    },
    {
        id: "cf-96a",
        title: "Football",
        description: `Petya loves football. One day he decided to find out if the situation on the field is dangerous. A situation is dangerous if there are at least 7 players of one team standing consecutively. Given positions of players, determine if it's dangerous.`,
        constraints: "1 ≤ length ≤ 100",
        sampleTests: [
            { input: "001001", expectedOutput: "NO" },
            { input: "1000000001", expectedOutput: "YES" },
        ],
        rating: 900,
    },
    {
        id: "cf-339a",
        title: "Helpful Maths",
        description: `Xenia the beginner mathematician is a third year student at elementary school. She is now learning the addition operation. She has a sum of the form "1+1+3" (one-digit numbers and pluses). Rearrange the summands in non-decreasing order and output the new sum.`,
        constraints: "Sum length ≤ 100",
        sampleTests: [
            { input: "3+2+1", expectedOutput: "1+2+3" },
            { input: "1+1+3+1+3", expectedOutput: "1+1+1+3+3" },
        ],
        rating: 800,
    },
    {
        id: "cf-112a",
        title: "Petya and Strings",
        description: `Little Petya loves presents. His mum bought him two strings of the same size. Compare them lexicographically. Ignore case. Output -1 if first < second, 0 if equal, 1 if first > second.`,
        constraints: "1 ≤ length ≤ 100",
        sampleTests: [
            { input: "aaaa\naaaA", expectedOutput: "0" },
            { input: "abs\nAbz", expectedOutput: "-1" },
        ],
        rating: 800,
    },
    {
        id: "cf-263a",
        title: "Beautiful Matrix",
        description: `You have a 5×5 matrix. The center is at (3,3). Find the minimum number of moves to move the single "1" to the center. In one move you can swap two adjacent rows or columns.`,
        constraints: "Matrix is 5×5",
        sampleTests: [
            { input: "0 0 0 0 0\n0 0 0 0 0\n0 1 0 0 0\n0 0 0 0 0\n0 0 0 0 0", expectedOutput: "1" },
        ],
        rating: 800,
    },
    {
        id: "cf-144a",
        title: "Arrival of the General",
        description: `A Colonel has n soldiers. Their heights are distinct. He wants to line them up by height (tallest first). In one move he can swap two adjacent soldiers. Find the minimum number of swaps.`,
        constraints: "2 ≤ n ≤ 100",
        sampleTests: [
            { input: "4\n33 44 11 22", expectedOutput: "2" },
        ],
        rating: 800,
    },
    {
        id: "cf-677a",
        title: "Vanya and Fence",
        description: `Vanya and his friends are walking along a fence of height h. Person i has height a_i. A person bending has width 2, otherwise 1. Find the minimum width of the road.`,
        constraints: "1 ≤ n, h ≤ 1000",
        sampleTests: [
            { input: "3 7\n4 5 14", expectedOutput: "4" },
        ],
        rating: 800,
    },
];
function pickClosestProblem(problems, targetRating, excludeIds) {
    const candidates = problems
        .filter((p) => !excludeIds.has(p.id))
        .map((p) => ({ p, dist: Math.abs((p.rating ?? 800) - targetRating) }))
        .sort((a, b) => a.dist - b.dist);
    const minDist = candidates[0]?.dist ?? 0;
    const ties = candidates.filter((c) => c.dist === minDist);
    const chosen = ties[Math.floor(Math.random() * ties.length)] ?? candidates[0];
    return chosen?.p ?? problems[0];
}
export function getProblemsForRounds(ratings) {
    const pool = [...HARDCODED_PROBLEMS];
    const used = new Set();
    const p1 = pickClosestProblem(pool, ratings[0], used);
    used.add(p1.id);
    const p2 = pickClosestProblem(pool, ratings[1], used);
    used.add(p2.id);
    const p3 = pickClosestProblem(pool, ratings[2], used);
    return [p1, p2, p3];
}
