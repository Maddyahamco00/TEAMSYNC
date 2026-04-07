import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create demo users
  const hashedPassword = await bcrypt.hash('password123', 12);

  const users = await Promise.all([
    prisma.user.upsert({
      where: { email: 'admin@teamsync.com' },
      update: {},
      create: {
        username: 'admin',
        email: 'admin@teamsync.com',
        password: hashedPassword,
        fullName: 'TeamSync Admin',
        status: 'online'
      }
    }),
    prisma.user.upsert({
      where: { email: 'john@teamsync.com' },
      update: {},
      create: {
        username: 'john',
        email: 'john@teamsync.com',
        password: hashedPassword,
        fullName: 'John Doe',
        status: 'online'
      }
    }),
    prisma.user.upsert({
      where: { email: 'jane@teamsync.com' },
      update: {},
      create: {
        username: 'jane',
        email: 'jane@teamsync.com',
        password: hashedPassword,
        fullName: 'Jane Smith',
        status: 'online'
      }
    })
  ]);

  console.log('✅ Created users:', users.map(u => u.username));

  // Create demo workspace
  const workspace = await prisma.workspace.upsert({
    where: { id: 'demo-workspace' },
    update: {},
    create: {
      id: 'demo-workspace',
      name: 'Demo Workspace',
      description: 'A demo workspace for TeamSync',
      ownerId: users[0].id,
      members: {
        create: users.map(user => ({
          userId: user.id,
          role: user.id === users[0].id ? 'admin' : 'member'
        }))
      },
      channels: {
        create: [
          {
            name: 'general',
            description: 'General discussion',
            type: 'PUBLIC',
            createdBy: users[0].id,
            members: {
              create: users.map(user => ({
                userId: user.id
              }))
            }
          },
          {
            name: 'random',
            description: 'Random conversations',
            type: 'PUBLIC',
            createdBy: users[0].id,
            members: {
              create: users.map(user => ({
                userId: user.id
              }))
            }
          },
          {
            name: 'development',
            description: 'Development discussions',
            type: 'PUBLIC',
            createdBy: users[0].id,
            members: {
              create: users.map(user => ({
                userId: user.id
              }))
            }
          }
        ]
      }
    },
    include: {
      channels: true
    }
  });

  console.log('✅ Created workspace:', workspace.name);

  // Create demo messages
  const messages = await Promise.all([
    prisma.message.create({
      data: {
        content: 'Welcome to TeamSync! 🎉',
        userId: users[0].id,
        username: users[0].username,
        channelId: workspace.channels[0].id
      }
    }),
    prisma.message.create({
      data: {
        content: 'This is a demo workspace to showcase TeamSync features.',
        userId: users[0].id,
        username: users[0].username,
        channelId: workspace.channels[0].id
      }
    }),
    prisma.message.create({
      data: {
        content: 'Hello everyone! 👋',
        userId: users[1].id,
        username: users[1].username,
        channelId: workspace.channels[0].id
      }
    }),
    prisma.message.create({
      data: {
        content: 'Great to be here! Looking forward to collaborating.',
        userId: users[2].id,
        username: users[2].username,
        channelId: workspace.channels[0].id
      }
    }),
    prisma.message.create({
      data: {
        content: 'Check out the development channel for technical discussions.',
        userId: users[0].id,
        username: users[0].username,
        channelId: workspace.channels[2].id
      }
    })
  ]);

  console.log('✅ Created demo messages');

  console.log('🎉 Database seeded successfully!');
  console.log('\n📋 Demo Accounts:');
  console.log('Admin: admin@teamsync.com / password123');
  console.log('User: john@teamsync.com / password123');
  console.log('User: jane@teamsync.com / password123');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });