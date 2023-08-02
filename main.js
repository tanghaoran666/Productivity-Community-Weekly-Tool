const { Client } = require('@notionhq/client');
const readline = require('readline-sync');
const moment = require('moment');
const _ = require('lodash');
const fs = require('fs');

const notion = new Client({
    auth: process.env.NOTION_TOKEN
});

async function getDataFromNotion(level) {
    const filter = {
        and: [
            { property: 'Status', status: { equals: 'Passed' } },
            { property: 'Level', select: { equals: level } },
            { property: 'Published On', date: { is_empty: true } }
        ]
    }
    const databaseId = 'b15f16208d0f4ace96b15940b826d487';
    const response = await notion.databases.query({
        database_id: databaseId,
        filter: filter,
        page_size: 200
    });
    return response.results
}

function getDataFromResponse(result) {
    return result.map(result => ({
        id: result.id,
        name: result.properties.Name.title[0].plain_text,
        level: result.properties.Level.select.name,
        description: result.properties.Description.rich_text[0].plain_text,
        typicalScenarios: result.properties.TypicalScenarios.rich_text[0]?.plain_text,
        url: result.properties.URL.url,
        submitter: result.properties.Submitter.people[0].person.email,
        tags: result.properties.Tags.multi_select.map(select => select.name)
    }));
}

function getRandomData(items) {
    const result = [];
    while (items.length) {
        const random = Math.floor(Math.random() * items.length);
        result.push(items.splice(random, 1)[0])

        if (result.length >= 3) {
            break
        }
    }

    return result
}

const selectedItems = new Set()
let fullData = {}
const LEVELS = {
    must: { name: 'Must Know', icon: '👍' },
    should: { name: 'Should Know', icon: '✌️' },
    good: { name: 'Good to Know', icon: '👍' }
}

async function confirm() {
    const requests = Array.from(selectedItems).map(item => {
        return notion.pages.update({
            page_id: item.id,
            properties: {
                "Published On": {
                    date: {
                        start: moment().format()
                    }
                }
            }
        }).then(() => {
            console.log(item.name, 'has been confirmed.')
        })
    })
    await Promise.all(requests).then(() => {
        console.log("Confirm completed.")
    })
}

async function initFullData() {
    // return fullData = JSON.parse(fs.readFileSync('/tmp/notion.json'))
    for (let level in LEVELS) {
        fullData[level] = getDataFromResponse(await getDataFromNotion(LEVELS[level].name))
    }
    // await fs.writeFileSync('/tmp/notion.json', JSON.stringify(fullData), 'utf8');
}

function extractRandomData() {
    const randomData = []
    for (let level in LEVELS) {
        let items = getRandomData(fullData[level]);
        for (let item of items) {
            randomData.push(item)
            console.log(`${ randomData.length }:`, item)
        }
    }

    return randomData
}

function toMarkdown() {
    let items = Array.from(selectedItems)
    const grouped = _.groupBy(items, 'level')

    const markdown = []
    for (let levelName in grouped) {
        const level = _.find(_.values(LEVELS), l => l.name == levelName)
        markdown.push(`# ${ level.icon } ${ level.name}`, '')
        grouped[levelName].forEach(item => {
            markdown.push(`## [${ item.name } 🔗](${ item.url || '' })`)
            markdown.push(`${item.tags.map(t => `#${ t }`).join(' ')} ${item.submitter}`)
            markdown.push(`❓简介：${item.description || ''}`)
            markdown.push(`📜场景：${item.typicalScenarios || ''}`)
            markdown.push('')
        })

        markdown.push('')
    }

    console.log(markdown.join("\n"))
}

(async function () {
    await initFullData()

    let randomData = extractRandomData()
    while (true) {
        let answer = readline.question('Type item numbers you like, e.g. 1358. Or (Q)uit/(L)ist/(M)arkdown/(R)efresh/(P)ublish/(C)lear: ')
        if (!isNaN(answer)) {
            const indices = Array.from(answer.toString()).map(Number).map(n => n - 1);
            for (let index of indices) {
                if (index >= 0 && index < randomData.length) {
                    selectedItems.add(randomData[index])
                }
            }
            answer = 'l'
        }

        switch (answer.toLowerCase()) {
            case 'q':
                return;
            case 'l':
                console.log("You have selected:");
                console.log(Array.from(selectedItems).map(i => {
                    return `- ${ i.level }: ${ i.name }`
                }).join("\n"))
                continue
            case 'm':
                console.log('Writing...');
                toMarkdown()
                continue
            case 'p':
                console.log('Publishing...');
                await confirm()
                continue
            case 'c':
                selectedItems.clear()
                console.log('Cleared all selected items.');
                continue
            // return;
            case 'r':
                console.log('Refreshing');
                randomData = extractRandomData();
                continue
            default:
                console.log('Invalid command.');
        }
    }
})()
