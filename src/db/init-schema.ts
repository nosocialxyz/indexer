import { DataTypes, QueryInterface } from 'sequelize';
import { withTransaction } from './db-utils';

export async function createPostTable(sequelize: QueryInterface) {
  await withTransaction(sequelize, async (transaction) => {
    await sequelize.createTable( 'profile',
      {
        id: {
          type: DataTypes.STRING,
          allowNull: false,
          primaryKey: true,
        },
        typename: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        profileId: {
          type: DataTypes.STRING,
          allowNull: true,
        },
        name: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        description: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        content: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        url: {
          type: DataTypes.STRING,
          allowNull: true,
        },
        mimeType: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        createdAt: {
          type: DataTypes.STRING,
          allowNull: true,
        },
        collecteModule: {
          type: DataTypes.STRING,
          allowNull: true,
        },
        referenceModule: {
          type: DataTypes.STRING,
          allowNull: true,
        },
        appId: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        hidden: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
        },
        reaction: {
          type: DataTypes.INTEGER,
          allowNull: false,
        },
        mirrorId: {
          type: DataTypes.INTEGER,
          allowNull: false,
        },
      },
      {
        transaction,
      },
    );
  });
}



export async function createCommentTable(sequelize: QueryInterface) {
  await withTransaction(sequelize, async (transaction) => {
    await sequelize.createTable( 'profile',
      {
        id: {
          type: DataTypes.STRING,
          allowNull: false,
          primaryKey: true,
        },
        typename: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        profileId: {
          type: DataTypes.STRING,
          allowNull: true,
        },
        name: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        description: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        content: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        url: {
          type: DataTypes.STRING,
          allowNull: true,
        },
        mimeType: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        createdAt: {
          type: DataTypes.STRING,
          allowNull: true,
        },
        collecteModule: {
          type: DataTypes.STRING,
          allowNull: true,
        },
        referenceModule: {
          type: DataTypes.STRING,
          allowNull: true,
        },
        appId: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        hidden: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
        },
        reaction: {
          type: DataTypes.INTEGER,
          allowNull: false,
        },
        mirrorId: {
          type: DataTypes.INTEGER,
          allowNull: false,
        },
      },
      {
        transaction,
      },
    );
  });
}



export async function createMirrorTable(sequelize: QueryInterface) {
  await withTransaction(sequelize, async (transaction) => {
    await sequelize.createTable( 'profile',
      {
        id: {
          type: DataTypes.STRING,
          allowNull: false,
          primaryKey: true,
        },
        typename: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        profileId: {
          type: DataTypes.STRING,
          allowNull: true,
        },
        createdAt: {
          type: DataTypes.STRING,
          allowNull: true,
        },
        appId: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        hidden: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
        },
        reaction: {
          type: DataTypes.INTEGER,
          allowNull: false,
        },
        mirrorId: {
          type: DataTypes.INTEGER,
          allowNull: false,
        },
      },
      {
        transaction,
      },
    );
  });
}

export async function createProfileTable(sequelize: QueryInterface) {
  await withTransaction(sequelize, async (transaction) => {
    await sequelize.createTable( 'profile',
      {
        id: {
          type: DataTypes.STRING,
          allowNull: false,
          primaryKey: true,
        },
        name: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        bio: {
          type: DataTypes.STRING,
          allowNull: true,
        },
        isDefault: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
        },
        followNftAddress: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        metadata: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        handle: {
          type: DataTypes.STRING,
          allowNull: true,
        },
        ownedBy: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        dispatcherAddress: {
          type: DataTypes.STRING,
          allowNull: true,
        },
        dispatcherCanUseRelay: {
          type: DataTypes.BOOLEAN,
          allowNull: true,
        },
        totalFollowers: {
          type: DataTypes.INTEGER,
          allowNull: false,
        },
        totalFollowing: {
          type: DataTypes.INTEGER,
          allowNull: false,
        },
        totalPosts: {
          type: DataTypes.INTEGER,
          allowNull: false,
        },
        totalComments: {
          type: DataTypes.INTEGER,
          allowNull: false,
        },
        totalMirrors: {
          type: DataTypes.INTEGER,
          allowNull: false,
        },
        totalPublications: {
          type: DataTypes.INTEGER,
          allowNull: false,
        },
        totalCollects: {
          type: DataTypes.INTEGER,
          allowNull: false,
        },
        followModule: {
          type: DataTypes.STRING,
          allowNull: true,
        },
      },
      {
        transaction,
      },
    );
  });
}
