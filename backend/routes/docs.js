const express = require('express');
const router = express.Router();

// API Documentation
router.get('/', (req, res) => {
  const docs = {
    openapi: '3.0.0',
    info: {
      title: 'ITAMS API',
      description: 'IT Asset Management System API',
      version: '9.0.0',
    },
    servers: [
      { url: '/api', description: 'API v1' },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
        apiKey: {
          type: 'apiKey',
          in: 'header',
          name: 'X-API-Key',
        },
      },
    },
    paths: {
      '/auth/login': {
        post: {
          tags: ['Auth'],
          summary: 'Login',
          requestBody: {
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['email', 'password'],
                  properties: {
                    email: { type: 'string', format: 'email' },
                    password: { type: 'string' },
                  },
                },
              },
            },
          },
          responses: {
            '200': { description: 'Login successful' },
            '401': { description: 'Invalid credentials' },
          },
        },
      },
      '/auth/register': {
        post: {
          tags: ['Auth'],
          summary: 'Register new user',
          requestBody: {
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['name', 'email', 'password'],
                  properties: {
                    name: { type: 'string' },
                    email: { type: 'string', format: 'email' },
                    password: { type: 'string', minLength: 6 },
                    department: { type: 'string' },
                  },
                },
              },
            },
          },
          responses: {
            '201': { description: 'Registration successful' },
            '400': { description: 'Email already exists' },
          },
        },
      },
      '/tickets': {
        get: {
          tags: ['Tickets'],
          summary: 'Get all tickets',
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'status', in: 'query', schema: { type: 'string' } },
            { name: 'priority', in: 'query', schema: { type: 'string' } },
            { name: 'page', in: 'query', schema: { type: 'integer' } },
          ],
          responses: {
            '200': { description: 'List of tickets' },
          },
        },
        post: {
          tags: ['Tickets'],
          summary: 'Create ticket',
          security: [{ bearerAuth: [] }],
          requestBody: {
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['title'],
                  properties: {
                    title: { type: 'string' },
                    description: { type: 'string' },
                    priority: { type: 'string', enum: ['low', 'medium', 'high', 'urgent'] },
                    category: { type: 'string' },
                  },
                },
              },
            },
          },
          responses: {
            '201': { description: 'Ticket created' },
          },
        },
      },
      '/tickets/{id}': {
        get: {
          tags: ['Tickets'],
          summary: 'Get ticket by ID',
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'id', in: 'path', required: true, schema: { type: 'integer' } },
          ],
          responses: {
            '200': { description: 'Ticket details' },
            '404': { description: 'Ticket not found' },
          },
        },
        put: {
          tags: ['Tickets'],
          summary: 'Update ticket',
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'id', in: 'path', required: true, schema: { type: 'integer' } },
          ],
          responses: {
            '200': { description: 'Ticket updated' },
          },
        },
        delete: {
          tags: ['Tickets'],
          summary: 'Delete ticket',
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'id', in: 'path', required: true, schema: { type: 'integer' } },
          ],
          responses: {
            '200': { description: 'Ticket deleted' },
          },
        },
      },
      '/assets': {
        get: {
          tags: ['Assets'],
          summary: 'Get all assets',
          security: [{ bearerAuth: [] }],
          responses: {
            '200': { description: 'List of assets' },
          },
        },
        post: {
          tags: ['Assets'],
          summary: 'Create asset',
          security: [{ bearerAuth: [] }],
          requestBody: {
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['name', 'type'],
                  properties: {
                    name: { type: 'string' },
                    type: { type: 'string' },
                    serial_number: { type: 'string' },
                    model: { type: 'string' },
                    manufacturer: { type: 'string' },
                  },
                },
              },
            },
          },
          responses: {
            '201': { description: 'Asset created' },
          },
        },
      },
      '/knowledgebase': {
        get: {
          tags: ['Knowledge Base'],
          summary: 'Get all articles',
          security: [{ bearerAuth: [] }],
          responses: {
            '200': { description: 'List of articles' },
          },
        },
        post: {
          tags: ['Knowledge Base'],
          summary: 'Create article',
          security: [{ bearerAuth: [] }],
          responses: {
            '201': { description: 'Article created' },
          },
        },
      },
      '/reports/dashboard': {
        get: {
          tags: ['Reports'],
          summary: 'Get dashboard statistics',
          security: [{ bearerAuth: [] }],
          responses: {
            '200': { description: 'Dashboard statistics' },
          },
        },
      },
      '/search': {
        get: {
          tags: ['Search'],
          summary: 'Global search',
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'q', in: 'query', required: true, schema: { type: 'string' } },
          ],
          responses: {
            '200': { description: 'Search results' },
          },
        },
      },
    },
    tags: [
      { name: 'Auth', description: 'Authentication endpoints' },
      { name: 'Tickets', description: 'Ticket management' },
      { name: 'Assets', description: 'Asset management' },
      { name: 'Knowledge Base', description: 'Knowledge base articles' },
      { name: 'Reports', description: 'Reports and analytics' },
      { name: 'Search', description: 'Search functionality' },
    ],
  };

  res.json(docs);
});

// Get API changelog
router.get('/changelog', (req, res) => {
  const changelog = [
    {
      version: '9.0.0',
      date: '2026-07-11',
      changes: [
        'Added Mobile API endpoints',
        'Added PWA support',
        'Added PDF export capabilities',
        'Added RBAC permissions system',
        'Added performance monitoring',
      ],
    },
    {
      version: '8.0.0',
      date: '2026-07-11',
      changes: [
        'Added advanced analytics with charts',
        'Added email templates system',
        'Added bulk actions for tickets and assets',
        'Added webhook system',
        'Added rate limiting',
      ],
    },
    {
      version: '7.0.0',
      date: '2026-07-11',
      changes: [
        'Added real-time chat',
        'Added document management',
        'Added QR/barcode generation',
        'Added client portal',
        'Added gamification system',
        'Added calendar view',
      ],
    },
    {
      version: '6.0.0',
      date: '2026-07-10',
      changes: [
        'Added integrations (Slack, Discord, etc.)',
        'Added customizable dashboard widgets',
        'Added multi-language support',
        'Added satisfaction surveys',
        'Added time tracking',
        'Added custom fields',
      ],
    },
    {
      version: '5.0.0',
      date: '2026-07-10',
      changes: [
        'Added two-factor authentication',
        'Added ticket templates',
        'Added AI-powered insights',
        'Added backup system',
      ],
    },
    {
      version: '4.0.0',
      date: '2026-07-10',
      changes: [
        'Added audit logs',
        'Added SLA management',
        'Added workflow automation',
        'Added advanced search',
        'Added real-time updates',
      ],
    },
    {
      version: '3.0.0',
      date: '2026-07-10',
      changes: [
        'Added reports and analytics',
        'Added email integration',
        'Added public API',
        'Added multi-tenant support',
      ],
    },
    {
      version: '2.0.0',
      date: '2026-07-10',
      changes: [
        'Added asset management',
        'Added notifications',
        'Added knowledge base',
      ],
    },
    {
      version: '1.0.0',
      date: '2026-07-10',
      changes: [
        'Initial release',
        'Authentication system',
        'Ticket management',
        'Dashboard',
      ],
    },
  ];

  res.json(changelog);
});

module.exports = router;
