export const configureFilter = (): void => {
    const posts = document.querySelectorAll('.post');
    const tags = document.querySelectorAll('.tags span');

    tags.forEach(tag => {
        (tag as HTMLElement).onclick = (): void => {
            tag.classList.toggle('active');

            // use the post tags to filter other posts
            const filters = [];
            posts.forEach((post): void => {
                if ((post as HTMLElement).contains(tag)) {
                    const postTags = post.querySelectorAll('.tags span');
                    postTags.forEach((postTag): void => {
                        if (postTag.classList.contains('active')) {
                            filters.push(postTag.textContent);
                        }
                    });
                }
            });

            if (filters.length === 0) {
                // if empty, there is no filter
                posts.forEach(post => {
                    post.classList.remove('dont-display');
                });
            } else {
                // if the post doesn't have all tags of the filter list, don't display
                posts.forEach(post => {
                    let nbOfTags = 0;
                    const postTags = post.querySelectorAll('.tags span');
                    postTags.forEach(postTag => {
                        if (filters.includes(postTag.textContent)) {
                            nbOfTags++;
                        }
                    });

                    if (nbOfTags == filters.length) {
                        post.classList.remove('dont-display');
                    } else {
                        post.classList.add('dont-display');
                    }
                });
            }

            // mark all tags with the filtered terms as active
            tags.forEach(tag => {
                const action = filters.includes(tag.textContent) ? 'add' : 'remove';
                tag.classList[action]('active');
            });
        }
    });
}