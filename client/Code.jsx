import React from 'react';
import { ApolloExplorerReact } from '@apollo/explorer';

function Code () {
  return (
    <div>
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
          <p className="text-center text-3xl font-bold text-gray-800 dark:text-white">Give it a try!</p>
            <div className="border-4 border-solid border-gray-200 rounded-lg h-[38rem]">
            <ApolloExplorerReact className='h-full'
      graphRef='Desolver-Ver-1@current'
      endpointUrl='http://localhost:3000/graphql'
      persistExplorerState={false}
      initialState={{
        document: `query ExampleQuery {
  helloWorld
  hello
  getUser {
    id
  }
}`,
        variables: {},
        headers: {},
        displayOptions: {
          showHeadersAndEnvVars: true, 
          docsPanelState: 'open', 
          theme: 'light',
        },
      }}
    />
            </div>
          </div>
        </div>
    </div>
  );
}

export default Code;
