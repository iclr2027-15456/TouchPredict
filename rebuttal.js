'use strict';

const rebuttalGroups = [
  {
    key: 'baseline', root: 'assets/rebuttal/pick3',
    recordings: [
      ['Grocery plant · 03', 'grocery_plant_demo_03'],
      ['Grocery target · 029', 'grocery_target_p1_demo_029'],
      ['Home bedroom · 057', 'home_bedroom_demo_057']
    ],
    streams: [
      ['RGB input', 'rgb.mp4'], ['Ground truth', 'gt_tactile.mp4'],
      ['Ours', 'ours_tactile.mp4'], ['HOPE', 'hope_tactile.mp4'],
      ['EgoTAC', 'egotac_tactile.mp4']
    ]
  },
  {
    key: 'segmentation', root: 'assets/rebuttal/website_clips_original',
    recordings: [
      ['Sports · 021', 'sports_dicks_p2_demo_021'],
      ['Sports · 087', 'sports_dicks_p1_demo_087'],
      ['Sports · 085', 'sports_dicks_p2_demo_085'],
      ['Office · 257', 'office_ml_p2_demo_257']
    ],
    streams: [
      ['RGB input', 'rgb_video.mp4'],
      ['Ground-truth segmentation', 'gt_segmentation.mp4'],
      ['Generated segmentation', 'gen_segmentation.mp4']
    ]
  }
];

function makeRecording(group, label, folder) {
  const source = file => `${group.root}/${folder}/${file}`;
  const article = document.createElement('article');
  article.className = 'rebuttal-recording';
  const heading = document.createElement('h4');
  heading.textContent = label;
  const scroller = document.createElement('div');
  scroller.className = 'rebuttal-scroller';
  const grid = document.createElement('div');
  grid.className = group.key === 'segmentation' ? 'rebuttal-grid rebuttal-grid-three' : 'rebuttal-grid rebuttal-grid-five';
  const videos = [];
  for (const [name, file] of group.streams) {
    const figure = document.createElement('figure');
    figure.className = 'rebuttal-tile';
    const caption = document.createElement('figcaption');
    caption.textContent = name;
    const video = document.createElement('video');
    video.src = source(file);
    video.muted = true;
    video.playsInline = true;
    video.preload = 'metadata';
    video.loop = true;
    video.setAttribute('aria-label', `${label}: ${name}`);
    video.addEventListener('error', () => {
      if (figure.querySelector('.rebuttal-error')) return;
      const error = document.createElement('p');
      error.className = 'rebuttal-error';
      error.textContent = 'Video unavailable';
      figure.append(error);
    });
    figure.append(caption, video);
    grid.append(figure);
    videos.push(video);
  }
  scroller.append(grid);
  const control = document.createElement('button');
  control.type = 'button';
  control.className = 'rebuttal-play';
  control.textContent = 'Play videos';
  control.setAttribute('aria-label', `Play ${label} videos`);
  article.append(heading, scroller);
  article.append(control);

  const master = videos[0];
  let playing = false;
  let visible = false;
  function pause() {
    playing = false;
    videos.forEach(video => video.pause());
    control.textContent = 'Play videos';
    control.setAttribute('aria-label', `Play ${label} videos`);
  }
  async function play() {
    playing = true;
    control.textContent = 'Pause videos';
    control.setAttribute('aria-label', `Pause ${label} videos`);
    const results = await Promise.allSettled(videos.map(video => video.play()));
    if (results.some(result => result.status === 'rejected')) pause();
  }
  master.addEventListener('timeupdate', () => {
    if (!playing) return;
    for (const video of videos.slice(1)) {
      if (video.readyState >= 2 && Math.abs(video.currentTime - master.currentTime) > 0.12) {
        video.currentTime = master.currentTime;
      }
    }
  });
  control.addEventListener('click', () => playing ? pause() : play());
  new IntersectionObserver(entries => {
    visible = entries[0].isIntersecting;
    if (visible && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) play();
    else pause();
  }, {threshold: 0.15}).observe(article);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) pause();
    else if (visible && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) play();
  });
  return article;
}

for (const group of rebuttalGroups) {
  const container = document.getElementById(`${group.key}-videos`);
  container.replaceChildren(...group.recordings.map(([label, folder]) => makeRecording(group, label, folder)));
}

const regressionExamples = [
  ['Sports · 073', '1_0012_sports_dicks_p1_demo_073'],
  ['Office · 258', '2_0002_office_ml_p2_demo_258'],
  ['Sports · 099', '3_0077_sports_dicks_p2_demo_099'],
  ['Sports · 010', '4_0097_sports_dicks_p2_demo_010'],
  ['Office · 200', '5_0008_office_ml_p2_demo_200']
];
const regressionRoot = 'assets/rebuttal/regression/regression_examples';
const regressionContainer = document.getElementById('regression-videos');
for (const [label, prefix] of regressionExamples) {
  const figure = document.createElement('figure');
  figure.className = 'regression-cell';
  const caption = document.createElement('figcaption');
  caption.textContent = label;
  const video = document.createElement('video');
  video.src = `${regressionRoot}/${prefix}_rgb.mp4`;
  video.poster = `${regressionRoot}/${prefix}_rgb.poster.png`;
  video.muted = true;
  video.playsInline = true;
  video.loop = true;
  video.preload = 'metadata';
  video.setAttribute('aria-label', `${label}: RGB input video`);
  figure.append(caption, video);
  regressionContainer.append(figure);
}
for (const [label, prefix] of regressionExamples) {
  const figure = document.createElement('figure');
  figure.className = 'regression-cell';
  const img = document.createElement('img');
  img.src = `${regressionRoot}/${prefix}_regression_tactile.poster.png`;
  img.alt = `${label}: regression tactile output`;
  img.loading = 'lazy';
  figure.append(img);
  regressionContainer.append(figure);
}
const regressionVideos = [...regressionContainer.querySelectorAll('video')];
new IntersectionObserver(entries => {
  const shouldPlay = entries[0].isIntersecting && !document.hidden && !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  for (const video of regressionVideos) {
    if (shouldPlay) video.play().catch(() => {});
    else video.pause();
  }
}, {threshold: 0.15}).observe(document.getElementById('regression-comparison'));
