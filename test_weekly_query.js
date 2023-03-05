const { Client } = require('@notionhq/client');

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
var mustKnowData
(async () => {
  const databaseId = 'b15f16208d0f4ace96b15940b826d487';
  const response = await notion.databases.query({
    database_id: databaseId,
    filter: MustKnowFilter
  });
  console.log('size', response.results.length)
  mustKnowData = response.results.map(result => ({
    name: result.properties.Name.title[0].plain_text,
    status: 'Must Know',
    description: result.properties.Description.rich_text[0].plain_text,
    //todo typicalScenarios: result.properties.get('Typical Scenarios').rich_text[0].plain_text,
    submitter: result.properties.Submitter.people[0].person.email,
    //todo tags,
  }))
  console.log(mustKnowData[0]);
})();
