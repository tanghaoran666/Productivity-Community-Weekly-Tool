const { Client } = require('@notionhq/client');
const readline = require('readline-sync');
const moment = require('moment');

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
const fullData = {}
const LEVELS = {
    must: 'Must Know',
    should: 'Should Know',
    good: 'Good to Know'
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
    console.log('Loading full data from Notion')
    for (let level in LEVELS) {
        fullData[level] = getDataFromResponse(await getDataFromNotion(LEVELS[level]))
    }
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

(async function () {
    await initFullData()

    let randomData = extractRandomData()
    while(true) {
        let answer =  readline.question('Type item numbers you like, e.g. 1358. Or (Q)uit/(S)ummary/(C)onfirm: ')
        if (!isNaN(answer)) {
            const indices = Array.from(answer.toString()).map(Number).map(n => n - 1);
            for (let index of indices) {
                if (index >= 0 && index < randomData.length) {
                    selectedItems.add(randomData[index])
                }
            }
            answer = 's'
        }

        switch (answer.toLowerCase()) {
            case 'q':
                return;
            case 's':
                console.log("You have selected:");
                console.log(Array.from(selectedItems).map(i => {
                    return `- ${ i.level }: ${i.name}`
                }).join("\n"))
                continue
            case 'c':
                console.log('Confirming...');
                await confirm()
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
