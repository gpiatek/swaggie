import { sortBy } from 'lodash';
import { prepareOperations, fixDuplicateOperations, getOperationName } from './genOperations';

describe('prepareOperations', () => {
  // TODO: For now we ignore custom content types
  // it(`operation's content type should be put in header`, () => {
  //   const ops = [
  //     {
  //       id: 'getPetById',
  //       summary: 'Find pet by ID',
  //       description: 'Returns a single pet',
  //       method: 'get',
  //       path: '/pet/{petId}',
  //       parameters: [],
  //       responses: [],
  //       group: null,
  //       accepts: ['application/json'],
  //       contentTypes: ['application/x-www-form-urlencoded'],
  //     },
  //   ] as ApiOperation[];

  //   const res = prepareOperations(ops, {} as any);

  //   expect(res).toBeDefined();
  //   expect(res[0].headers).toMatchObject([
  //     {
  //       name: 'contentType',
  //       originalName: 'Content-Type',
  //       type: 'string',
  //       optional: false,
  //     },
  //   ]);
  // });

  it(`operation's empty header list should be handled correctly`, () => {
    const ops = [
      {
        id: 'getPetById',
        summary: 'Find pet by ID',
        description: 'Returns a single pet',
        method: 'get',
        path: '/pet/{petId}',
        parameters: [],
        responses: [],
        group: null,
        accepts: ['application/json'],
        contentTypes: [],
      },
    ] as ApiOperation[];

    const [res] = prepareOperations(ops, {} as any);

    expect(res).toBeDefined();
    expect(res[0].headers).toMatchObject([]);
  });

  it(`operation's content type should be put in header + more headers in parameters`, () => {
    const ops = [
      {
        id: 'getPetById',
        summary: 'Find pet by ID',
        description: 'Returns a single pet',
        method: 'get',
        path: '/pet/{petId}',
        parameters: [
          {
            name: 'Some-Other',
            in: 'header',
            description: '',
            required: true,
            allowEmptyValue: true,
            schema: {
              type: 'string',
            },
          },
        ],
        responses: [],
        group: null,
        accepts: ['application/json'],
        contentTypes: ['application/x-www-form-urlencoded'],
      },
    ] as ApiOperation[];

    const [res] = prepareOperations(ops, {} as any);

    expect(res).toBeDefined();
    expect(res[0].headers).toMatchObject([
      {
        name: 'someOther',
        originalName: 'Some-Other',
        type: 'string',
        optional: false,
      },
      // TODO: For now we ignore custom content types
      // {
      //   name: 'contentType',
      //   originalName: 'Content-Type',
      //   type: 'string',
      //   optional: false,
      //   value: 'application/x-www-form-urlencoded',
      // },
    ]);
  });

  it(`operation's param should be used instead of operation's default content types`, () => {
    const ops = [
      {
        id: 'getPetById',
        summary: 'Find pet by ID',
        description: 'Returns a single pet',
        method: 'get',
        path: '/pet/{petId}',
        parameters: [
          {
            name: 'Content-Type',
            in: 'header',
            description: '',
            required: true,
            allowEmptyValue: true,
            schema: {
              type: 'string',
            },
          },
        ],
        responses: [],
        group: null,
        accepts: ['application/json'],
        contentTypes: ['application/x-www-form-urlencoded'],
      },
    ] as ApiOperation[];

    const [res] = prepareOperations(ops, {} as any);

    expect(res).toBeDefined();
    expect(res[0].headers).toBeDefined();
    const orderedHeaders = sortBy(res[0].headers, 'name');
    expect(orderedHeaders).toMatchObject([
      {
        name: 'contentType',
        originalName: 'Content-Type',
        type: 'string',
        optional: false,
      },
    ]);
  });

  describe('generate query model', () => {
    const op =
      {
        id: 'Pet_GetPetById',
        summary: 'Find pet by ID',
        description: 'Returns a single pet',
        method: 'get',
        path: '/pet/{petId}',
        parameters: [
          {
            name: 'FirstParameter',
            in: 'query',
            description: '',
            required: true,
            type: 'string',
          },
          {
            name: 'SecondParameter',
            in: 'query',
            description: '',
            required: true,
            type: 'string',
          }],
        responses: [],
        group: 'Pet',
        accepts: ['application/json'],
        contentTypes: [],
      }  as ApiOperation;

    it('query model should be generated instead array of params', () =>{
      const expectedQueryType = 'IGetPetByIdFromPetServiceQuery';

      const [res, queryDefs] = prepareOperations([op], {queryModels: true} as any);

      expect(queryDefs[expectedQueryType]).toBeDefined();
      expect(queryDefs[expectedQueryType].type).toBe('object');
      expect(queryDefs[expectedQueryType].properties).toMatchObject({
        [op.parameters[0].name]: op.parameters[0],
        [op.parameters[1].name]: op.parameters[1],
      });

      expect(res[0]).toBeDefined();
      expect(res[0].parameters.length).toBe(1);
      expect(res[0].parameters[0].name).toBe('petGetPetByIdQuery');
      expect(res[0].parameters[0].type).toBe(expectedQueryType);
    });

    it('query model should not be generated', () =>{
      const [res, queryDef] = prepareOperations([op], {} as any);

      expect(queryDef).toMatchObject({});
      expect(res[0]).toBeDefined();
      expect(res[0].parameters.length).toBe(op.parameters.length);
    });
  })

});

describe('fixDuplicateOperations', () => {
  it(`handle empty list`, () => {
    const ops = [];

    const res = fixDuplicateOperations(ops);

    expect(res).toMatchObject([]);
  });

  it(`handle list with 1 item only`, () => {
    const ops = [
      {
        id: 'getPetById',
        summary: 'Find pet by ID',
        description: 'Returns a single pet',
        method: 'get',
        path: '/pet/{petId}',
        parameters: [],
        responses: [],
        group: null,
        accepts: ['application/json'],
        contentTypes: ['application/x-www-form-urlencoded'],
      },
    ] as ApiOperation[];

    const res = fixDuplicateOperations(ops);

    // Basically it should be the same
    expect(res).toMatchObject(ops);
  });

  it(`handle 2 different operations`, () => {
    const ops = [
      {
        id: 'getPetById',
        summary: 'Find pet by ID',
        description: 'Returns a single pet',
        method: 'get',
        path: '/pet/{petId}',
        parameters: [],
        responses: [],
        group: null,
        accepts: ['application/json'],
        contentTypes: ['application/x-www-form-urlencoded'],
      },
      {
        id: 'somethingElse',
        summary: 'Random',
        description: 'Random',
        method: 'get',
        path: '/pet/{petId}',
        parameters: [],
        responses: [],
        group: null,
        accepts: ['application/json'],
        contentTypes: [],
      },
    ] as ApiOperation[];

    const res = fixDuplicateOperations(ops);

    // Basically it should be the same
    expect(res).toMatchObject(ops);
  });

  it(`handle 2 operations with the same id`, () => {
    const ops = [
      {
        id: 'getPetById',
        summary: 'Find pet by ID',
        description: 'Returns a single pet',
        method: 'get',
        path: '/pet/{petId}',
        parameters: [],
        responses: [],
        group: null,
        accepts: ['application/json'],
        contentTypes: [],
      },
      {
        id: 'getPetById',
        summary: 'Random',
        description: 'Random',
        method: 'post',
        path: '/pet/{petId}',
        parameters: [],
        responses: [],
        group: null,
        accepts: ['application/json'],
        contentTypes: [],
      },
    ] as ApiOperation[];

    const res = fixDuplicateOperations(ops);

    expect(res[1].id).not.toBe(res[0].id);
  });

  // TODO: If someone wants to adjust code to fix this issue, then please go ahead :)
  /*
  it(`handle 3 operations with the same id even after fix`, () => {
    const ops = [
      {
        id: 'getPetById',
        summary: 'Find pet by ID',
        description: 'Returns a single pet',
        method: 'get',
        path: '/pet/{petId}',
        parameters: [],
        responses: [],
        group: null,
        accepts: ['application/json'],
        contentTypes: [],
      },
      {
        id: 'getPetById',
        summary: 'Random',
        description: 'Random',
        method: 'post',
        path: '/pet/{petId}',
        parameters: [],
        responses: [],
        group: null,
        accepts: ['application/json'],
        contentTypes: [],
      },
      {
        id: 'getPetById1',
        summary: 'Random',
        description: 'Random',
        method: 'post',
        path: '/pet/{petId}',
        parameters: [],
        responses: [],
        group: null,
        accepts: ['application/json'],
        contentTypes: [],
      },
    ] as ApiOperation[];

    const res = fixDuplicateOperations(ops);

    console.log('Ops', ops.map(e => e.id));
    console.log('Res', res.map(e => e.id));

    expect(res[0].id).not.toBe(res[1].id);
    expect(res[1].id).not.toBe(res[2].id);
  });
*/
});

describe('getOperationName', () => {
  [
    { input: { opId: 'test', group: null }, expected: 'test' },
    { input: { opId: 'test', group: '' }, expected: 'test' },
    { input: { opId: null, group: 'group' }, expected: '' },
    { input: { opId: '', group: 'group' }, expected: '' },
    { input: { opId: null, group: null }, expected: '' },
    { input: { opId: '', group: '' }, expected: '' },
    { input: { opId: 'Test_GetPetStory', group: 'Test' }, expected: 'getPetStory' },
  ].forEach((el) => {
    it(`should handle ${JSON.stringify(el.input)}`, () => {
      const res = getOperationName(el.input.opId, el.input.group);

      expect(res).toBe(el.expected);
    });
  });
});
