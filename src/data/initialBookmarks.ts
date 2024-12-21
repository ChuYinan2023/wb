import { Bookmark } from '../types';

export const initialBookmarks: Bookmark[] = [
  {
    id: '1',
    url: 'https://example.com',
    title: 'Example Website',
    description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco.',
    tags: ['example', 'demo', 'web'],
    createdAt: new Date(),
    thumbnail: 'https://images.unsplash.com/photo-1481487196290-c152efe083f5?w=32&h=32&fit=crop&auto=format',
    keywords: ['technology', 'web development', 'programming']
  },
  {
    id: '2',
    url: 'https://example.org',
    title: 'Another Example',
    description: 'Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident.',
    tags: ['sample', 'test'],
    createdAt: new Date(Date.now() - 86400000), // Yesterday
    thumbnail: 'https://images.unsplash.com/photo-1499951360447-b19be8fe80f5?w=32&h=32&fit=crop&auto=format',
    keywords: ['design', 'user experience', 'interface']
  }
];