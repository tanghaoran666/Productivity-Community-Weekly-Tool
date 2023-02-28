const { Client } = require('@notionhq/client');

const notion = new Client({ auth: '' });

(async () => {
  const databaseId = 'b15f16208d0f4ace96b15940b826d487';
  const response = await notion.databases.query({
    database_id: databaseId,
    filter: {
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
        }
      ],
    }
  });
  var properties = response.results[0].properties.Name.title
  console.log(properties);
})();
