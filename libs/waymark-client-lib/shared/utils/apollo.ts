import { ApolloCache, DocumentNode } from '@apollo/client';
import _ from 'lodash';

/**
 * Removes query data form the apollo cache
 */
export function evictFromApolloCache(cache: ApolloCache<any>, queryDataToEvict: any) {
  const apolloCacheId = cache.identify(queryDataToEvict);

  // Evict the data from the cache
  cache.evict({
    id: apolloCacheId,
  });

  // Run garbage collection to free up memory and ensure things are updated
  // to reflect that the data was removed
  cache.gc();
}

const addNodesToEdgesArray = <
  TNode extends Record<string, any> & { id: string },
  TEdgeTypename extends string,
  TEdge extends {
    node: TNode;
    __typename: TEdgeTypename;
  },
>(
  edges: TEdge[],
  newNodeOrNodes: TNode | TNode[],
  edgeTypeName: TEdgeTypename,
  sortEdges?: (nodeA: TEdge, nodeB: TEdge) => number,
) => {
  let newEdges = [...edges];

  // Normalize the new node(s) as an array
  const newNodeArray = Array.isArray(newNodeOrNodes) ? newNodeOrNodes : [newNodeOrNodes];

  // Add all of the new nodes to our edges array
  newNodeArray.forEach((newNode) => {
    // See if an existing edge matches the provided node; if so, we'll just update that entry
    const edgeToUpdateIndex = newEdges.findIndex((edge) => edge.node.id === newNode.id);

    if (edgeToUpdateIndex >= 0) {
      newEdges[edgeToUpdateIndex] = {
        ...newEdges[edgeToUpdateIndex],
        node: newNode,
      };
    } else {
      // If there wasn't an existing node, insert a new one at the front
      newEdges.splice(0, 0, {
        __typename: edgeTypeName,
        node: newNode,
      } as TEdge);
    }
  });

  if (sortEdges) {
    // If a sortEdges callback was provided, use it to sort the new edges array
    newEdges = newEdges.sort(sortEdges);
  }

  return newEdges;
};

/**
 * Creates or updates an edge in the apollo cache entry for a specific fragment. This should be called in the `update` method on apollo mutations.
 * This is useful for instance when adding an item to a library so we can make sure the cache is updated to
 * reflect that new item.
 *
 * @param {Object} cache  Apollo cache object which we'll update
 * @param {Object|Object[]} newNodeOrNodes  One node or an array of nodes to add to the cache
 * @param {Object} config
 * @param {DocumentNode} config.fragment  The GraphQL fragment representing the shape of the data which we want to update in the cache (ie, if we want to add a font to a cached font library,
 *                                          we should use the `fontLibraryFields` fragment because we're updating the font library's cache entry)
 * @param {string} config.fragmentName  The name of the provided GraphQL fragment (ie, for `fontLibraryFields`, the fragment name is "FontLibraryFields")
 *                                        This is necessary because often our fragments are composed of other smaller fragments, and apollo needs to know exactly
 *                                        which specific one we want to use.
 * @param {string} config.fragmentCacheID  The apollo cache ID of the cache entry we want to update (ie, the id derived from `cache.identify(fontLibraryNode)`)
 * @param {string} config.edgeTypeName  The name of the edge type in the cache entry to update (ie, 'FontLibraryFontNodeEdge')
 * @param {string} config.edgesDotPath  The dot-separated string path to the edges array in the cache entry we're updating (ie, 'fonts.edges')
 * @param {function} [config.sortEdges]   An optional method to call to sort the newly updated edges array before storing it in the cache,
 *                                        if we want to make sure we retain a certain order after adding new items
 *
 * @example
 * const todoListFragment = gql`
 *  fragment TodoListFields on TodoList {
 *    todos {
 *      edges {
 *        ...
 *      }
 *    }
 *  }
 * `;
 *
 * // Mutation adds a new "todo" item to an existing todo list
 * apolloClient.mutate({
 *  mutation: ...,
 *  variables: ...,
 *  update(cache, response) {
 *    const { createdTodo, updatedToDoList } = response.data.addTodoListItem;
 *
 *    createOrUpdateApolloCacheFragmentEdges(cache, createdTodo, {
 *      fragment: todoListFragment,
 *      fragmentName: 'FontLibraryFields',
 *      fragmentCacheID: cache.identify(updatedToDoList),
 *      edgesDotPath: 'todos.edges',
 *      edgeTypeName: 'TodoNodeEdge',
 *    });
 *  }
 * });
 */
export function createOrUpdateApolloCacheFragmentEdges<
  TFragmentData extends Record<string, any>,
  TNode extends Record<string, any> & { id: string },
  TEdgeTypename extends string,
  TEdge extends {
    node: TNode;
    __typename: TEdgeTypename;
  },
>(
  cache: ApolloCache<any>,
  newNodeOrNodes: TNode | TNode[],
  {
    fragment,
    fragmentName,
    fragmentCacheID,
    edgeTypeName,
    edgesDotPath,
    sortEdges,
  }: {
    fragment: DocumentNode;
    fragmentName: string;
    fragmentCacheID: string;
    edgeTypeName: TEdgeTypename;
    edgesDotPath: string;
    sortEdges?: (a: TEdge, b: TEdge) => number;
  },
) {
  // Read all of the existing data from the cache entry that we want to update
  const currentCachedDataToUpdate = cache.readFragment<TFragmentData>({
    id: fragmentCacheID,
    fragment,
    fragmentName,
  });

  // If we couldn't read data from the cache, bail out; this may have been called prematurely so there's nothing
  // loaded in the cache to update yet.
  if (!currentCachedDataToUpdate) {
    return;
  }

  const currentEdges: TEdge[] = _.get(currentCachedDataToUpdate, edgesDotPath);

  // Get an updated edges array with the node(s) added
  const newEdges = addNodesToEdgesArray(currentEdges, newNodeOrNodes, edgeTypeName, sortEdges);

  // Construct a new cache data object and write it to the cache
  const newCacheData = _.cloneDeep(currentCachedDataToUpdate);
  _.set(newCacheData, edgesDotPath, newEdges);

  cache.writeFragment({
    id: fragmentCacheID,
    fragment,
    fragmentName,
    data: newCacheData,
  });
}

/**
 * Creates or updates an edge in the apollo cache entry for a query. This should be called in the `update` method on apollo mutations.
 * This is useful for instance when creating a new library that belongs to an account so we can make sure that this new library starts
 * being included for queries for the account's libraries.
 *
 * @param {Object} cache  Apollo cache object which we'll update
 * @param {Object|Object[]} newNodeOrNodes  One node or an array of nodes to add to the cache
 * @param {Object} config
 * @param {DocumentNode} config.query  The GraphQL query whose value we want to update in the cache (ie, accountImageLibraryQuery)
 * @param {Object} config.variables     The variables for the query which we want to update (ie, { accountGUID: "abcdefg" })
 * @param {string} config.edgeTypeName  The name of the edge type in the cache entry to update (ie, 'FontLibraryFontNodeEdge')
 * @param {string} config.edgesDotPath  The dot-separated string path to the edges array in the cache entry we're updating (ie, 'fonts.edges')
 * @param {function} [config.sortEdges]   An optional method to call to sort the newly updated edges array before storing it in the cache,
 *                                        if we want to make sure we retain a certain order after adding new items
 *
 * @example
 * const todoListsForAccountQuery = gql`
 *  query TodoListsForAccount($accountGUID: String!) {
 *    accountByGuid(guid: $accountGUID) {
 *      todoLists {
 *        edges {
 *          ...
 *        }
 *      }
 *    }
 *  }
 * `;
 *
 * // Mutation creates a new TodoList for an account
 * apolloClient.mutate({
 *  mutation: ...,
 *  variables: ...,
 *  update(cache, response) {
 *    const { createdTodoList } = response.data.createTodoList;
 *
 *    createOrUpdateApolloCacheFragmentEdges(cache, createdTodo, {
 *      query: todoListsForAccountQuery,
 *      variables: { accountGUID },
 *      edgesDotPath: 'accountByGuid.todoLists.edges',
 *      edgeTypeName: 'TodoListNodeEdge',
 *      // Ensure we retain ordering by ascending `order` field values
 *      sortEdges: ({ node: todoListA }, { node: todoListB }) => todoListA.order - todoListB.order,
 *    });
 *  }
 * });
 */
export function createOrUpdateApolloCacheQueryEdges<
  TQueryData extends Record<string, any>,
  TNode extends Record<string, any> & { id: string },
  TEdgeTypename extends string,
  TEdge extends {
    node: TNode;
    __typename: TEdgeTypename;
  },
>(
  cache: ApolloCache<any>,
  newNodeOrNodes: TNode | TNode[],
  {
    query,
    variables,
    edgeTypeName,
    edgesDotPath,
    sortEdges,
  }: {
    query: DocumentNode;
    variables: Record<string, any>;
    edgeTypeName: TEdgeTypename;
    edgesDotPath: string;
    sortEdges?: (a: TEdge, b: TEdge) => number;
  },
) {
  const currentCachedDataToUpdate = cache.readQuery<TQueryData>({
    query,
    variables,
  });

  // If we couldn't read data from the cache, bail out; this may have been called prematurely so there's nothing
  // loaded in the cache to update yet.
  if (!currentCachedDataToUpdate) {
    return;
  }

  const currentEdges: TEdge[] = _.get(currentCachedDataToUpdate, edgesDotPath);

  // Get an updated edges array with the node(s) added
  const newEdges = addNodesToEdgesArray(currentEdges, newNodeOrNodes, edgeTypeName, sortEdges);

  // Construct a new cache data object and write it to the cache
  const newCacheData = _.cloneDeep(currentCachedDataToUpdate);
  _.set(newCacheData, edgesDotPath, newEdges);

  cache.writeQuery({
    query,
    variables,
    data: newCacheData,
  });
}
