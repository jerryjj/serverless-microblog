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
  updates[`/posts/${newPostKey}`] = postData;
  updates[`/user-posts/${uid}/${newPostKey}`] = postData;

  // Execute the updates
  return firebase.database().ref().update(updates);
};

/**
 * Create new user item to database
 */
const writeUserData = (userId, name, email) => {
  firebase.database().ref(`users/${userId}`).set({
    username: name,
    email: email
  });
};

const createPostElement = (postId, title, body, author, authorId, allowAdmin) => {
  let adminHtml = '';
  let userId = null;

  if (allowAdmin && firebase.auth().currentUser) {
    userId = firebase.auth().currentUser.uid;
    if (userId === authorId) {
      adminHtml = `<div>
          <button class="btn btn-danger btn-remove">Remove</button>
        </div>
      `;
    }
  }

  const html = `<div class="panel panel-default post-${postId}">
      <div class="panel-body">
        <h4 class="title"></h4>
        <p class="body"></p>
        ${adminHtml}
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

  let bodyTxt = body;
  if (bodyTxt.length > 140) {
    bodyTxt = bodyTxt.substr(0, 140) + '...';
  }

  // Set values.
  postElement.getElementsByClassName('title')[0].innerText = title;
  postElement.getElementsByClassName('body')[0].innerText = bodyTxt;
  postElement.getElementsByClassName('author')[0].innerText = author || 'No.Name.Set';

  if (adminHtml) {
    const removeButton = postElement.getElementsByClassName('btn-remove')[0];
    removeButton.onclick = () => {
      firebase.database().ref(`/posts/${postId}`).remove();
      firebase.database().ref(`/user-posts/${userId}/${postId}`).remove();
    };
  }

  return postElement;
};

const removePostElement = (postId) => {
  const els = document.getElementsByClassName(`post-${postId}`);
  if (els.length) {
    Array.prototype.forEach.call(els, (el) => {
      el.remove();
    });
  }
};

/**
 * When new posts come, render them
 */
const fetchPosts = (postsRef, sectionElement, allowAdmin) => {
  postsRef.on('child_added', (data) => {
    const containerElement = sectionElement.getElementsByClassName('posts-container')[0];
    containerElement.insertBefore(
      createPostElement(
        data.key, data.val().title, data.val().body, data.val().author, data.val().uid, allowAdmin
      ),
      containerElement.firstChild
    );
  });
  postsRef.on('child_removed', (data) => {
    removePostElement(data.key);
  });
};

const getRecentPosts = () => {
  const recentPostsSection = document.getElementById('recent-posts-list');
  const recentPostsRef = firebase.database().ref('posts').limitToLast(30);
  fetchPosts(recentPostsRef, recentPostsSection, false);
};

const getUsersPosts = () => {
  const userPostsSection = document.getElementById('user-posts-list');
  if (firebase.auth().currentUser) {
    const currentUserId = firebase.auth().currentUser.uid;
    const userPostsRef = firebase.database().ref(`user-posts/${currentUserId}`);
    fetchPosts(userPostsRef, userPostsSection, true);
    showUsersPosts();
  }
};

const showUsersPosts = () => {
  const recentsCol = document.getElementById('recent-posts-col');
  const usersCol = document.getElementById('user-posts-col');
  recentsCol.className = 'col-lg-6';
  usersCol.style.display = 'block';
};

const hideUsersPosts = () => {
  const recentsCol = document.getElementById('recent-posts-col');
  const usersCol = document.getElementById('user-posts-col');
  recentsCol.className = 'col-lg-12';
  usersCol.style.display = 'none';
};

window.addEventListener('load', () => {
  const signInButton = document.getElementById('sign-in-btn');
  const logoutButton = document.getElementById('logout-btn');
  const usernameHolder = document.getElementById('wlc-username');
  const postForm = document.getElementById('post-form');

  signInButton.addEventListener('click', () => {
    let provider = new firebase.auth.GoogleAuthProvider();
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
      writeUserData(user.uid, user.displayName, user.email);
      signInButton.style.display = 'none';
      logoutButton.style.display = 'block';
      postForm.style.display = 'block';
      usernameHolder.innerText = user.displayName;
      getUsersPosts();
    } else {
      signInButton.style.display = 'block';
      logoutButton.style.display = 'none';
      postForm.style.display = 'none';
      hideUsersPosts();
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
