import { NextApiRequest, NextApiResponse } from "next";
import { without } from "lodash";

import prismadb from '@/libs/prismadb';
import serverAuth from "@/libs/serverAuth";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {

    if(req.method !== 'POST' && req.method !== 'DELETE') return res.status(405).end();

    const { currentUser } = await serverAuth(req);
    const { movieId } = req.body;

    const existingMovie = await prismadb.movie.findUnique({
        where: {
          id: movieId,
        }
    });

    if (!existingMovie) {
        throw new Error('Invalid ID');
    }
      
    if (req.method === 'POST') {

      const user = await prismadb.user.update({
        where: {
          email: currentUser.email || '',
        },
        data: {
          favoriteIds: {
            push: movieId
          }
        }
      });
  
      return res.status(200).json(user);
    }

    if (req.method === 'DELETE') {

      const updatedFavoriteIds = without(currentUser.favoriteIds, movieId);

      const updatedUser = await prismadb.user.update({
        where: {
          email: currentUser.email || '',
        },
        data: {
          favoriteIds: updatedFavoriteIds,
        }
      });

      return res.status(200).json(updatedUser);
    }
    
  } catch (error) {
    console.log(error);

    return res.status(500).end();
  }
}