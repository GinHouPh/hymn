import { PrismaClient, UserRole, MediaType } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@hymnal.app' },
    update: {},
    create: {
      email: 'admin@hymnal.app',
      username: 'admin',
      passwordHash: adminPassword,
      firstName: 'Admin',
      lastName: 'User',
      role: UserRole.ADMIN,
      isVerified: true,
    },
  });
  console.log('✅ Admin user created:', admin.email);

  // Create moderator user
  const moderatorPassword = await bcrypt.hash('moderator123', 12);
  const moderator = await prisma.user.upsert({
    where: { email: 'moderator@hymnal.app' },
    update: {},
    create: {
      email: 'moderator@hymnal.app',
      username: 'moderator',
      passwordHash: moderatorPassword,
      firstName: 'Moderator',
      lastName: 'User',
      role: UserRole.MODERATOR,
      isVerified: true,
    },
  });
  console.log('✅ Moderator user created:', moderator.email);

  // Create regular user
  const userPassword = await bcrypt.hash('user123', 12);
  const user = await prisma.user.upsert({
    where: { email: 'user@hymnal.app' },
    update: {},
    create: {
      email: 'user@hymnal.app',
      username: 'user',
      passwordHash: userPassword,
      firstName: 'Regular',
      lastName: 'User',
      role: UserRole.USER,
      isVerified: true,
    },
  });
  console.log('✅ Regular user created:', user.email);

  // Create sample songs
  const songs = [
    {
      title: 'Amazing Grace',
      lyrics: `Amazing grace! How sweet the sound
That saved a wretch like me!
I once was lost, but now am found;
Was blind, but now I see.

'Twas grace that taught my heart to fear,
And grace my fears relieved;
How precious did that grace appear
The hour I first believed.

Through many dangers, toils, and snares,
I have already come;
'Tis grace hath brought me safe thus far,
And grace will lead me home.

The Lord has promised good to me,
His Word my hope secures;
He will my Shield and Portion be,
As long as life endures.`,
      composer: 'John Newton',
      category: 'Traditional',
      tags: ['grace', 'salvation', 'traditional'],
      language: 'en',
      isPublished: true,
    },
    {
      title: 'How Great Thou Art',
      lyrics: `O Lord my God, when I in awesome wonder
Consider all the worlds Thy hands have made,
I see the stars, I hear the rolling thunder,
Thy power throughout the universe displayed.

Then sings my soul, my Savior God, to Thee:
How great Thou art! How great Thou art!
Then sings my soul, my Savior God, to Thee:
How great Thou art! How great Thou art!

When through the woods and forest glades I wander
And hear the birds sing sweetly in the trees,
When I look down from lofty mountain grandeur
And hear the brook and feel the gentle breeze.

And when I think that God, His Son not sparing,
Sent Him to die, I scarce can take it in,
That on the cross, my burden gladly bearing,
He bled and died to take away my sin.`,
      composer: 'Carl Boberg',
      category: 'Worship',
      tags: ['worship', 'nature', 'praise'],
      language: 'en',
      isPublished: true,
    },
    {
      title: 'Be Thou My Vision',
      lyrics: `Be Thou my vision, O Lord of my heart;
Naught be all else to me, save that Thou art.
Thou my best thought, by day or by night,
Waking or sleeping, Thy presence my light.

Be Thou my wisdom, and Thou my true word;
I ever with Thee and Thou with me, Lord;
Thou my great Father, I Thy true son;
Thou in me dwelling, and I with Thee one.

Riches I heed not, nor man's empty praise,
Thou mine inheritance, now and always:
Thou and Thou only, first in my heart,
High King of Heaven, my treasure Thou art.

High King of Heaven, my victory won,
May I reach Heaven's joys, O bright Heaven's Sun!
Heart of my own heart, whatever befall,
Still be my vision, O Ruler of all.`,
      composer: 'Traditional Irish',
      category: 'Celtic',
      tags: ['vision', 'devotion', 'celtic'],
      language: 'en',
      isPublished: true,
    },
    {
      title: 'Holy, Holy, Holy',
      lyrics: `Holy, holy, holy! Lord God Almighty!
Early in the morning our song shall rise to Thee;
Holy, holy, holy, merciful and mighty!
God in three Persons, blessed Trinity!

Holy, holy, holy! All the saints adore Thee,
Casting down their golden crowns around the glassy sea;
Cherubim and seraphim falling down before Thee,
Which wert, and art, and evermore shalt be.

Holy, holy, holy! though the darkness hide Thee,
Though the eye of sinful man Thy glory may not see;
Only Thou art holy; there is none beside Thee,
Perfect in power, in love, and purity.

Holy, holy, holy! Lord God Almighty!
All Thy works shall praise Thy Name, in earth, and sky, and sea;
Holy, holy, holy; merciful and mighty!
God in three Persons, blessed Trinity!`,
      composer: 'Reginald Heber',
      category: 'Trinity',
      tags: ['holy', 'trinity', 'worship'],
      key: 'Eb',
      timeSignature: '4/4',
      tempo: 'Maestoso',
      difficulty: 'Medium',
      language: 'English',
      yearWritten: 1826,
      description: 'A majestic hymn celebrating the holiness of the Trinity.',
    },
    {
      title: 'It Is Well With My Soul',
      lyrics: `When peace, like a river, attendeth my way,
When sorrows like sea billows roll;
Whatever my lot, Thou hast taught me to say,
It is well, it is well with my soul.

It is well with my soul,
It is well, it is well with my soul.

Though Satan should buffet, though trials should come,
Let this blest assurance control,
That Christ hath regarded my helpless estate,
And hath shed His own blood for my soul.

My sin, oh the bliss of this glorious thought!
My sin, not in part but the whole,
Is nailed to the cross, and I bear it no more,
Praise the Lord, praise the Lord, O my soul!

And Lord, haste the day when the faith shall be sight,
The clouds be rolled back as a scroll;
The trump shall resound, and the Lord shall descend,
Even so, it is well with my soul.`,
      composer: 'Horatio Spafford',
      category: 'Comfort',
      tags: ['peace', 'comfort', 'faith'],
      key: 'C',
      timeSignature: '4/4',
      tempo: 'Andante',
      difficulty: 'Easy',
      language: 'English',
      yearWritten: 1873,
      description: 'A hymn of faith and peace written during personal tragedy.',
    },
  ];

  for (const songData of songs) {
    const song = await prisma.song.upsert({
      where: { title: songData.title },
      update: {},
      create: songData,
    });
    console.log(`✅ Song created: ${song.title}`);
  }

  // Create user preferences for the regular user
  await prisma.userPreferences.upsert({
    where: { userId: user.id },
    update: {},
    create: {
      userId: user.id,
      theme: 'light',
      fontSize: 16,
      autoplay: false,
      notifications: true,
      language: 'en',
    },
  });
  console.log('✅ User preferences created');

  // Add some favorites for the regular user
  const allSongs = await prisma.song.findMany();
  const favoriteSongs = allSongs.slice(0, 3); // First 3 songs

  for (const song of favoriteSongs) {
    await prisma.songFavorite.upsert({
      where: {
        userId_songId: {
          userId: user.id,
          songId: song.id,
        },
      },
      update: {},
      create: {
        userId: user.id,
        songId: song.id,
      },
    });
  }
  console.log(`✅ Added ${favoriteSongs.length} favorites for user`);

  // Create a sample playlist
  const playlist = await prisma.playlist.upsert({
    where: {
      userId_name: {
        userId: user.id,
        name: 'My Favorite Hymns',
      },
    },
    update: {},
    create: {
      userId: user.id,
      name: 'My Favorite Hymns',
      description: 'A collection of my most beloved hymns',
      isPublic: false,
    },
  });

  // Add songs to the playlist
  for (let i = 0; i < favoriteSongs.length; i++) {
    await prisma.playlistSong.upsert({
      where: {
        playlistId_songId: {
          playlistId: playlist.id,
          songId: favoriteSongs[i].id,
        },
      },
      update: {},
      create: {
        playlistId: playlist.id,
        songId: favoriteSongs[i].id,
        order: i + 1,
      },
    });
  }
  console.log('✅ Sample playlist created with songs');

  // Add some view history
  for (const song of allSongs.slice(0, 4)) {
    await prisma.viewHistory.create({
      data: {
        userId: user.id,
        songId: song.id,
      },
    });
  }
  console.log('✅ View history entries created');

  console.log('🎉 Database seeding completed successfully!');
  console.log('\n📋 Test Accounts:');
  console.log('Admin: admin@hymnal.app / admin123');
  console.log('Moderator: moderator@hymnal.app / moderator123');
  console.log('User: user@hymnal.app / user123');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });