const {Client} = require('@notionhq/client');

const notion = new Client({ auth: '' });

const MustKnowFilter = {
    and: [
        {
            property: 'Status',
            status: {
                equals: 'Passed',
            },
        },
        {
            property: 'Level',
            select: {
                equals: 'Must Know',
            },
        },
        {
            property: 'Published At',
            date: {
                is_empty: true,
            }
        }
    ]
};

const ShouldKnowFilter = {
    and: [
        {
            property: 'Status',
            status: {
                equals: 'Passed',
            },
        },
        {
            property: 'Level',
            select: {
                equals: 'Should Know',
            },
        },
        {
            property: 'Published At',
            date: {
                is_empty: true,
            }
        }
    ]
};


async function getDataFromNotion(filter) {
    const databaseId = 'b15f16208d0f4ace96b15940b826d487';
    const response = await notion.databases.query({
        database_id: databaseId,
        filter: filter
    });
    return response.results

};

getDataFromNotion(MustKnowFilter).then(result => {
    var mustKnowData = getDataFromResponse(result)
    var mustKnows = getThreeRandomData(mustKnowData)
    console.log('=========Must Know List=========')
    console.log(mustKnows)
})

getDataFromNotion(ShouldKnowFilter).then(result => {
  var shouldKnowData = getDataFromResponse(result);
  var mustKnows = getThreeRandomData(shouldKnowData);
  console.log('=========Should Know List=========')
  console.log(mustKnows)
})

function getDataFromResponse(result) {
  var mustKnowData = result.map(result => ({
    name: result.properties.Name.title[0].plain_text,
    level: result.properties.Level.select.name,
    description: result.properties.Description.rich_text[0].plain_text,
    typicalScenarios: result.properties.TypicalScenarios.rich_text[0]?.plain_text,
    submitter: result.properties.Submitter.people[0].person.email,
    tags: result.properties.Tags.multi_select.map(select => select.name)
  }))
  return mustKnowData;
}

function getThreeRandomData(dataList) {
  var result = []
  for (let i = 0; i < 3; i++) {
    var random = Math.floor(Math.random() * dataList.length)
    var mustKnow = dataList[random];
    dataList.splice(random, 1)
    result.push(mustKnow)
  }
  return result;
}
