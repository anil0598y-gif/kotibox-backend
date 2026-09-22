const User = require("../models/User");
const Song = require("../models/Song");
const Artist = require("../models/Artist");
const Playlist = require("../models/Playlist");

/* =========================================
   ✅ GET ALL SONGS
========================================= */
const getAllSongs = async (req, res) => {
  try {
    const songs = await Song.find().sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: songs.length,
      songs,
      data: songs,
    });
  } catch (error) {
    console.error("GET ALL SONGS ERROR:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch songs",
    });
  }
};

/* =========================================
   ✅ GET ALL ALBUMS
========================================= */
const getAllAlbums = async (req, res) => {
  try {
    const songs = await Song.find().sort({ createdAt: -1 });

    const albumsMap = new Map();

    songs.forEach((song) => {
      const albumName = song.album || "Unknown Album";

      if (!albumsMap.has(albumName)) {
        albumsMap.set(albumName, {
          _id: albumName,
          title: albumName,
          artist: song.artist || "Unknown Artist",
          imageUrl: song.imageUrl || "",
          songs: [],
        });
      }

      albumsMap.get(albumName).songs.push(song);
    });

    const albums = Array.from(albumsMap.values());

    res.status(200).json({
      success: true,
      count: albums.length,
      albums,
      data: albums,
    });
  } catch (error) {
    console.error("GET ALL ALBUMS ERROR:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch albums",
    });
  }
};

/* =========================================
   ✅ GET ALL ARTISTS
========================================= */
const getAllArtists = async (req, res) => {
  try {
    const artists = await Artist.find().sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: artists.length,
      artists,
      data: artists,
    });
  } catch (error) {
    console.error("GET ALL ARTISTS ERROR:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch artists",
    });
  }
};

/* =========================================
   LIKE SONG
========================================= */
const likeSong = async (req, res) => {
  try {
    const { songId } = req.params;
    const userId = req.user._id;

    const song = await Song.findById(songId);
    if (!song) {
      return res.status(404).json({ success: false, message: "Song not found" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const alreadyLiked = user.likedSongs.some(
      (id) => String(id) === String(songId)
    );

    if (alreadyLiked) {
      return res.status(200).json({ success: true, message: "Song already liked" });
    }

    user.likedSongs.push(songId);
    await user.save();

    res.status(200).json({
      success: true,
      message: "Song liked successfully",
      likedSongs: user.likedSongs,
    });
  } catch (error) {
    console.error("LIKE SONG ERROR:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to like song",
    });
  }
};

/* =========================================
   UNLIKE SONG
========================================= */
const unlikeSong = async (req, res) => {
  try {
    const { songId } = req.params;
    const userId = req.user._id;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    user.likedSongs = user.likedSongs.filter(
      (id) => String(id) !== String(songId)
    );

    await user.save();

    res.status(200).json({
      success: true,
      message: "Song unliked",
      likedSongs: user.likedSongs,
    });
  } catch (error) {
    console.error("UNLIKE SONG ERROR:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to unlike song",
    });
  }
};

/* =========================================
   GET LIKED SONGS
========================================= */
const getLikedSongs = async (req, res) => {
  try {
    const userId = req.user._id;

    const user = await User.findById(userId).populate("likedSongs");

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.status(200).json({
      success: true,
      count: user.likedSongs.length,
      songs: user.likedSongs,
      data: user.likedSongs,
    });
  } catch (error) {
    console.error("GET LIKED SONGS ERROR:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch liked songs",
    });
  }
};

/* =========================================
   ✅ ADD TO HISTORY  ← FIXED WITH DEBUG
========================================= */
const addToHistory = async (req, res) => {
  try {
    const { songId } = req.params;
    const userId = req.user._id;

    console.log("🔍 ADD TO HISTORY CALLED:");
    console.log("   songId:", songId);
    console.log("   userId:", userId);

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // ✅ recentlyPlayed array check karo
    if (!Array.isArray(user.recentlyPlayed)) {
      user.recentlyPlayed = [];
    }

    // ✅ Purana entry hatao
    user.recentlyPlayed = user.recentlyPlayed.filter(
      (item) => String(item.song) !== String(songId)
    );

    // ✅ Naya entry add karo
    user.recentlyPlayed.unshift({
      song: songId,
      playedAt: new Date(),
    });

    // ✅ Sirf last 50 rakho
    if (user.recentlyPlayed.length > 50) {
      user.recentlyPlayed = user.recentlyPlayed.slice(0, 50);
    }

    // ✅ songsPlayed count badhao
    user.songsPlayed = (user.songsPlayed || 0) + 1;

    await user.save();

    console.log("✅ History added. Total:", user.recentlyPlayed.length);

    res.status(200).json({
      success: true,
      message: "Added to history",
      count: user.recentlyPlayed.length,
    });
  } catch (error) {
    console.error("ADD HISTORY ERROR:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to add history",
    });
  }
};

/* =========================================
   ✅ GET HISTORY  ← FIXED WITH DEBUG
========================================= */
const getHistory = async (req, res) => {
  try {
    const userId = req.user._id;

    console.log("🔍 GET HISTORY CALLED:");
    console.log("   userId:", userId);

    const user = await User.findById(userId).populate("recentlyPlayed.song");

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    console.log("   recentlyPlayed raw length:", user.recentlyPlayed?.length);

    // ✅ Filter karo — sirf woh jinka song exist karta hai
    const history = (user.recentlyPlayed || []).filter((item) => item.song);

    console.log("   history after filter:", history.length);

    res.status(200).json({
      success: true,
      count: history.length,
      history: history,
      data: history,
    });
  } catch (error) {
    console.error("GET HISTORY ERROR:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch history",
    });
  }
};

/* =========================================
   CLEAR HISTORY
========================================= */
const clearHistory = async (req, res) => {
  try {
    const userId = req.user._id;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    user.recentlyPlayed = [];
    await user.save();

    res.status(200).json({ success: true, message: "History cleared" });
  } catch (error) {
    console.error("CLEAR HISTORY ERROR:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to clear history",
    });
  }
};

/* =========================================
   FOLLOW ARTIST
========================================= */
const followArtist = async (req, res) => {
  try {
    const { artistId } = req.params;
    const userId = req.user._id;

    const artist = await Artist.findById(artistId);
    if (!artist) {
      return res.status(404).json({ success: false, message: "Artist not found" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const alreadyFollowing = user.followedArtists.some(
      (id) => String(id) === String(artistId)
    );

    if (alreadyFollowing) {
      return res.status(200).json({
        success: true,
        message: "Already following artist",
      });
    }

    user.followedArtists.push(artistId);
    await user.save();

    res.status(200).json({
      success: true,
      message: "Artist followed",
      followedArtists: user.followedArtists,
    });
  } catch (error) {
    console.error("FOLLOW ARTIST ERROR:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to follow artist",
    });
  }
};

/* =========================================
   UNFOLLOW ARTIST
========================================= */
const unfollowArtist = async (req, res) => {
  try {
    const { artistId } = req.params;
    const userId = req.user._id;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    user.followedArtists = user.followedArtists.filter(
      (id) => String(id) !== String(artistId)
    );

    await user.save();

    res.status(200).json({
      success: true,
      message: "Artist unfollowed",
      followedArtists: user.followedArtists,
    });
  } catch (error) {
    console.error("UNFOLLOW ARTIST ERROR:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to unfollow artist",
    });
  }
};

/* =========================================
   GET FOLLOWING
========================================= */
const getFollowing = async (req, res) => {
  try {
    const userId = req.user._id;

    const user = await User.findById(userId).populate("followedArtists");

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.status(200).json({
      success: true,
      count: user.followedArtists.length,
      artists: user.followedArtists,
      data: user.followedArtists,
    });
  } catch (error) {
    console.error("GET FOLLOWING ERROR:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch following",
    });
  }
};

/* =========================================
   CREATE USER PLAYLIST
========================================= */
const createUserPlaylist = async (req, res) => {
  try {
    const userId = req.user._id;
    const { name, description, isPublic } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: "Playlist name is required",
      });
    }

    const playlist = await Playlist.create({
      name: name.trim(),
      description: description || "",
      createdBy: userId,
      isPublic: isPublic !== undefined ? isPublic : true,
      songs: [],
      userPlaylist: true,
    });

    const user = await User.findById(userId);
    if (user) {
      if (!Array.isArray(user.userPlaylists)) user.userPlaylists = [];
      user.userPlaylists.push(playlist._id);
      await user.save();
    }

    res.status(201).json({
      success: true,
      message: "Playlist created",
      data: playlist,
      playlist,
    });
  } catch (error) {
    console.error("CREATE PLAYLIST ERROR:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to create playlist",
    });
  }
};

/* =========================================
   ✅ GET USER PLAYLISTS — FIXED
========================================= */
const getUserPlaylists = async (req, res) => {
  try {
    const userId = req.user._id;

    console.log("🔍 GET USER PLAYLISTS DEBUG:");
    console.log("   userId:", userId);
    console.log("   userId string:", String(userId));

    const totalPlaylists = await Playlist.countDocuments();
    console.log("   Total playlists in DB:", totalPlaylists);

    const playlists = await Playlist.find({
      $or: [
        { createdBy: userId },
        { createdBy: String(userId) },
        { owner: userId },
      ],
    })
      .populate("songs")
      .sort({ createdAt: -1 });

    console.log("   User playlists found:", playlists.length);

    res.status(200).json({
      success: true,
      count: playlists.length,
      playlists,
      data: playlists,
    });
  } catch (error) {
    console.error("GET USER PLAYLISTS ERROR:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch playlists",
    });
  }
};

/* =========================================
   UPDATE PLAYLIST
========================================= */
const updatePlaylist = async (req, res) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;
    const { name, description, isPublic } = req.body;

    const playlist = await Playlist.findById(id);
    if (!playlist) {
      return res.status(404).json({ success: false, message: "Playlist not found" });
    }

    if (String(playlist.createdBy) !== String(userId)) {
      return res.status(403).json({ success: false, message: "Not authorized" });
    }

    if (name) playlist.name = name.trim();
    if (description !== undefined) playlist.description = description;
    if (isPublic !== undefined) playlist.isPublic = isPublic;

    await playlist.save();

    res.status(200).json({
      success: true,
      message: "Playlist updated",
      data: playlist,
      playlist,
    });
  } catch (error) {
    console.error("UPDATE PLAYLIST ERROR:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to update playlist",
    });
  }
};

/* =========================================
   DELETE PLAYLIST
========================================= */
const deletePlaylist = async (req, res) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;

    const playlist = await Playlist.findById(id);
    if (!playlist) {
      return res.status(404).json({ success: false, message: "Playlist not found" });
    }

    if (String(playlist.createdBy) !== String(userId)) {
      return res.status(403).json({ success: false, message: "Not authorized" });
    }

    await Playlist.findByIdAndDelete(id);

    const user = await User.findById(userId);
    if (user && Array.isArray(user.userPlaylists)) {
      user.userPlaylists = user.userPlaylists.filter(
        (pid) => String(pid) !== String(id)
      );
      await user.save();
    }

    res.status(200).json({ success: true, message: "Playlist deleted" });
  } catch (error) {
    console.error("DELETE PLAYLIST ERROR:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to delete playlist",
    });
  }
};

/* =========================================
   ADD SONG TO PLAYLIST
========================================= */
const addSongToPlaylist = async (req, res) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;
    const { songId } = req.body;

    if (!songId) {
      return res.status(400).json({ success: false, message: "Song ID is required" });
    }

    const playlist = await Playlist.findById(id);
    if (!playlist) {
      return res.status(404).json({ success: false, message: "Playlist not found" });
    }

    if (String(playlist.createdBy) !== String(userId)) {
      return res.status(403).json({ success: false, message: "Not authorized" });
    }

    const alreadyIn = (playlist.songs || []).some(
      (id) => String(id) === String(songId)
    );

    if (alreadyIn) {
      return res.status(200).json({ success: true, message: "Song already in playlist" });
    }

    playlist.songs = playlist.songs || [];
    playlist.songs.push(songId);
    await playlist.save();

    const updated = await Playlist.findById(id).populate("songs");

    res.status(200).json({
      success: true,
      message: "Song added to playlist",
      data: updated,
      playlist: updated,
    });
  } catch (error) {
    console.error("ADD SONG ERROR:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to add song",
    });
  }
};

/* =========================================
   REMOVE SONG FROM PLAYLIST
========================================= */
const removeSongFromPlaylist = async (req, res) => {
  try {
    const userId = req.user._id;
    const { id, songId } = req.params;

    const playlist = await Playlist.findById(id);
    if (!playlist) {
      return res.status(404).json({ success: false, message: "Playlist not found" });
    }

    if (String(playlist.createdBy) !== String(userId)) {
      return res.status(403).json({ success: false, message: "Not authorized" });
    }

    playlist.songs = (playlist.songs || []).filter(
      (id) => String(id) !== String(songId)
    );

    await playlist.save();

    const updated = await Playlist.findById(id).populate("songs");

    res.status(200).json({
      success: true,
      message: "Song removed",
      data: updated,
      playlist: updated,
    });
  } catch (error) {
    console.error("REMOVE SONG ERROR:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to remove song",
    });
  }
};

/* =========================================
   SEARCH SONGS
========================================= */
const searchSongs = async (req, res) => {
  try {
    const { q } = req.query;

    if (!q || !q.trim()) {
      return res.status(400).json({ success: false, message: "Search query is required" });
    }

    const searchRegex = new RegExp(q.trim(), "i");

    const songs = await Song.find({
      $or: [
        { title: searchRegex },
        { artist: searchRegex },
        { album: searchRegex },
      ],
      status: { $ne: "Archived" },
    }).limit(50);

    res.status(200).json({ success: true, count: songs.length, songs, data: songs });
  } catch (error) {
    console.error("SEARCH SONGS ERROR:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to search songs",
    });
  }
};

/* =========================================
   GET SONGS BY GENRE
========================================= */
const getSongsByGenre = async (req, res) => {
  try {
    const { genre } = req.params;

    const songs = await Song.find({
      genre: new RegExp(`^${genre}$`, "i"),
      status: { $ne: "Archived" },
    }).limit(100);

    res.status(200).json({
      success: true,
      count: songs.length,
      genre,
      songs,
      data: songs,
    });
  } catch (error) {
    console.error("GET SONGS BY GENRE ERROR:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch songs",
    });
  }
};

/* =========================================
   GET SONGS BY ARTIST
========================================= */
const getSongsByArtist = async (req, res) => {
  try {
    const { artistId } = req.params;

    const artist = await Artist.findById(artistId);
    if (!artist) {
      return res.status(404).json({ success: false, message: "Artist not found" });
    }

    const songs = await Song.find({
      artist: new RegExp(`^${artist.name}$`, "i"),
      status: { $ne: "Archived" },
    }).limit(100);

    res.status(200).json({
      success: true,
      count: songs.length,
      artist: artist.name,
      songs,
      data: songs,
    });
  } catch (error) {
    console.error("GET SONGS BY ARTIST ERROR:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch songs",
    });
  }
};

/* =========================================
   STREAM SONG
========================================= */
const streamSong = async (req, res) => {
  try {
    const { id } = req.params;

    const song = await Song.findById(id);
    if (!song) {
      return res.status(404).json({ success: false, message: "Song not found" });
    }

    res.status(200).json({
      success: true,
      audioUrl: song.audioUrl,
      song,
    });
  } catch (error) {
    console.error("STREAM SONG ERROR:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to stream song",
    });
  }
};

/* =========================================
   INCREMENT PLAY COUNT
========================================= */
const incrementPlayCount = async (req, res) => {
  try {
    const { id } = req.params;

    const song = await Song.findByIdAndUpdate(
      id,
      { $inc: { plays: 1 } },
      { new: true }
    );

    if (!song) {
      return res.status(404).json({ success: false, message: "Song not found" });
    }

    res.status(200).json({
      success: true,
      message: "Play count updated",
      plays: song.plays,
      data: song,
    });
  } catch (error) {
    console.error("PLAY COUNT ERROR:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to update play count",
    });
  }
};

/* =========================================
   EXPORT
========================================= */
module.exports = {
  getAllSongs,
  getAllAlbums,
  getAllArtists,
  likeSong,
  unlikeSong,
  getLikedSongs,
  addToHistory,
  getHistory,
  clearHistory,
  followArtist,
  unfollowArtist,
  getFollowing,
  createUserPlaylist,
  getUserPlaylists,
  updatePlaylist,
  deletePlaylist,
  addSongToPlaylist,
  removeSongFromPlaylist,
  searchSongs,
  getSongsByGenre,
  getSongsByArtist,
  streamSong,
  incrementPlayCount,
};