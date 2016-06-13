'use strict';

/**
 * Create new post item to database
 */
const writeNewPost = (uid, username, title, body) => {
  // A post entry.
  const postData = {
    author: username,
    uid: uid,
    title: title,
    body: body
  };

  // Get a key for a new Post.
  const newPostKey = firebase.database().ref().child('posts').push().key;

  // Write the new post's data simultaneously in the posts list and the user's post list.
  let updates = {};
  updates['/posts/' + newPostKey] = postData;
  updates['/user-posts/' + uid + '/' + newPostKey] = postData;

  // Execute the updates
  return firebase.database().ref().update(updates);
};

/**
 * Create new user item to database
 */
const writeUserData = (userId, name, email) => {
  firebase.database().ref('users/' + userId).set({
    username: name,
    email: email
  });
};

const createPostElement = (postId, title, text, author) => {
  let html = `<div class="panel panel-default">
      <div class="panel-body">
        <h4 class="title"></h4>
        <p class="body"></p>
      </div>
      <div class="panel-footer">
        <small>By: <span class="author"></span></small>
      </div>
    </div>
  `;

  // Create the DOM element from the HTML.
  var div = document.createElement('div');
  div.innerHTML = html;
  var postElement = div.firstChild;

  // Set values.
  postElement.getElementsByClassName('title')[0].innerText = title;
  postElement.getElementsByClassName('body')[0].innerText = text;
  postElement.getElementsByClassName('author')[0].innerText = author || 'No.Name.Set';

  return postElement;
};

/**
 * When new posts come, render them
 */
const fetchPosts = (postsRef, sectionElement) => {
  postsRef.on('child_added', function(data) {
    const containerElement = sectionElement.getElementsByClassName('posts-container')[0];
    containerElement.insertBefore(
      createPostElement(data.key, data.val().title, data.val().body, data.val().author),
      containerElement.firstChild
    );
  });
};

const getUsersPosts = () => {
  const userPostsSection = document.getElementById('user-posts-list');
  if (firebase.auth().currentUser) {
    const currentUserId = firebase.auth().currentUser.uid;
    const userPostsRef = firebase.database().ref('user-posts/' + currentUserId);
    fetchPosts(userPostsRef, userPostsSection);
  }
};

const getRecentPosts = () => {
  const recentPostsSection = document.getElementById('recent-posts-list');
  const recentPostsRef = firebase.database().ref('posts').limitToLast(30);
  fetchPosts(recentPostsRef, recentPostsSection);
};

const enablePosting = () => {
  const postForm = document.getElementById('post-form');
  postForm.style.display = 'block';
};

window.addEventListener('load', () => {
  const signInButton = document.getElementById('sign-in-btn');
  const logoutButton = document.getElementById('logout-btn');
  const usernameHolder = document.getElementById('wlc-username');
  const postForm = document.getElementById('post-form');

  signInButton.addEventListener('click', () => {
    var provider = new firebase.auth.GoogleAuthProvider();
    firebase.auth().signInWithPopup(provider);
  });
  logoutButton.addEventListener('click', () => {
    firebase.auth().signOut().then(() => {
      document.getElementById('user-posts-list')
      .getElementsByClassName('posts-container')[0].innerText = '';
      usernameHolder.innerText = 'Anonymous';
    });
  });

  // Listen for auth state changes
  firebase.auth().onAuthStateChanged((user) => {
    if (user) {
      signInButton.style.display = 'none';
      logoutButton.style.display = 'block';
      usernameHolder.innerText = user.displayName;
      writeUserData(user.uid, user.displayName, user.email);
      enablePosting();
      getUsersPosts();
    } else {
      signInButton.style.display = 'block';
      logoutButton.style.display = 'none';
    }
  });

  postForm.onsubmit = (e) => {
    e.preventDefault();
    const userId = firebase.auth().currentUser.uid;
    const titleInput = document.getElementById('title-i');
    const bodyInput = document.getElementById('body-i');

    if (titleInput.value && bodyInput.value) {
      let title = titleInput.value;
      let body = bodyInput.value;
      titleInput.value = '';
      bodyInput.value = '';

      if (!userId) {
        alert('not authenticated!');
        return;
      }

      firebase.database().ref('/users/' + userId).once('value').then((snapshot) => {
        let username = snapshot.val().username;
        writeNewPost(
          firebase.auth().currentUser.uid,
          firebase.auth().currentUser.displayName || 'No.Name.Set',
          title,
          body
        );
      });
    }
  };

  getRecentPosts();

}, false);
