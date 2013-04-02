// GIVit, a demo Backbone web application by Harold Rodriguez
// It displays Rails issues from GitHub using Backbone.


$(function(){ // When the DOM is ready(), load our web app logic

	/********* Issue Model *********
	 * Issues have a number, a title, labels, a user with gravatar, and a text body.
	 * Corresponding variable names derived from the GitHub API are: number, title, labels, user, body */
	var Issue = Backbone.Model.extend({ 
	
	});

	/********* Issue Collection *********/
	/* The collection of issues will source the models using the GitHub API (JSON web hook interface). */
	var IssueCollection = Backbone.Collection.extend({

		// Define the collection's model.
		model: Issue,

   		// Set the URL for the collection (i.e. the GitHub API URI)
		url: 'https://api.github.com/repos/rails/rails/issues?direction=desc&per_page=25', // We want 25 issues per page

		// Since we won't have all issues at one time, the collection keeps track of pagination
		pageInfo: { prev: 0, next: 0, last: 0 },

		// Customize the updating behavior, which requires fetching new data
	    	update: function(options) {
			this.fetch({

				// Pass in the page parameter for the GET request
				data: { page: options.data.page },

				// When we fetch issues, we must also check the 'Link' response header for pagination info upon ajax completion
				complete: function(xhr) {
					var links = xhr.getResponseHeader('Link').split(',');
					for (var i=0; i<links.length; i++) {
						if (!prev) var prev = links[i].match(/&page=(\d+).*?>; rel="prev"/);
						if (!next) var next = links[i].match(/&page=(\d+).*?>; rel="next"/);
						if (!last) var last = links[i].match(/&page=(\d+).*?>; rel="last"/);
					}
					if (prev) prev=prev[1]; if (next) next=next[1]; if (last) last=last[1];

					Issues.pageInfo.prev = prev;
					Issues.pageInfo.next = next;
					Issues.pageInfo.last = last;
					
					App.repaginate(Issues.pageInfo); // repaginate the App view based on the parsed rel tags
				}
			});
		}
	});

	/********* Issue View *********/
	var IssueView = Backbone.View.extend({

		//We'll use a table row as an issue's DOM element.
		tagName: "tr",

		// Templates for viewing an issue, either basic or detailed views
		templateBasic: _.template($('#template-issuebasic').html()),
		templateDetails: _.template($('#template-issuedetails').html()),

		// Bind click events for when you click on issue views
		events: {
			"click .viewdetails" : "viewdetails",
			"click .scrolltocomments" : "scrolltoComments"
		},

		// How to render issue views
		render: function() {

			// If the GitHub user didn't bother to type an issue description, use our own 
			this.model.attributes.body = (this.model.attributes.body ? this.model.attributes.body : 'No description entered for this issue')

			// Render the view using a template
			this.$el.html(this.templateBasic(this.model.toJSON()));

			return this;
		},

		// Helper function that will view an issue's details and then autoscroll to the comments section
		scrolltoComments: function(e) {
			e.scrollTo = '#comments';
			this.viewdetails(e);
		},

		// Called to view this issue's details.
		viewdetails: function(e) {

				// Change the interface to details mode
				App.interface.html( this.templateDetails( this.model.toJSON()) );

				// Update the button to get back to the particular page we were just viewing
				$('#back').attr('onclick','openpage('+(Issues.pageInfo.next ? parseInt(Issues.pageInfo.next)-1 : 
								parseInt(Issues.pageInfo.prev)+1)+')').clone().css('margin-top','15px').insertAfter('#issue-list');

				// Since we'd like to be able to view an issue's comments as well, we must retrieve 'em
				var Comments = new CommentCollection({ issue_id: this.model.attributes.number });
				
				Comments.fetch({
					complete: function(xhr){
						// When we're done fetching comments, we'll transform their Date Created a bit,
						// and then throw them into a comment template, and onto the comments section
						var commentTemplate = _.template($('#template-comment').html());
						var commentList = JSON.parse(xhr.responseText);
						for(var i=0; i<commentList.length; i++) {
							var date = commentList[i].created_at.match(/(\d{4})-(\d{2})-(\d{2})/);
							commentList[i].created_at = date[2]+'/'+date[3]+'/'+date[1];
							$('#comments').append( commentTemplate(commentList[i]) );
						}
						if (e.scrollTo) { $.scrollTo($(e.scrollTo), { duration: 500 }); } // Scroll to comments section if necessary
					}
				});
		}
	});

	/********* Comment Model *********/
	/* A comment on an issue */
	var Comment = Backbone.Model.extend({ 

	});

	/********* Comment Collection *********/
	/* If an issue has comments, we want to collect them. */
	var CommentCollection = Backbone.Collection.extend({

		// Define the model.
		model: Comment,

	    	// When we create the collection, it'll be for a specific issue
	    	initialize: function(options) {
			this.issue_id = options.issue_id;
		},
	
		// Set the URL for the collection based on the issue_id
		url: function(e) { return 'https://api.github.com/repos/rails/rails/issues/'+this.issue_id+'/comments' }

	});

	/********* Application View *********/
	/* The main application UI. */
	var AppView = Backbone.View.extend({

		// Bind to the appropiate "app" element in the html.
		el: $("#givit-app"),

		// Listen for updates in the issues collection, and do some DOM manipulation
		initialize: function() {
				this.listenTo(Issues, 'sync', this.sync);
				this.listenTo(Issues, 'all', this.render);

				this.views = Array();
				this.interface = this.$('interface');

				// Clone the pagination nav buttons to the bottom of the list for easy browsing
				$('.pagination').clone().css('margin-top','15px').insertAfter('#issue-list');

				// Use the browser location's hash, if present, as a starting page for easy bookmarking
				var hash = parseInt(location.hash.replace(/#/,''));
				this.displayPage( hash ? hash : 1 ); // Normally bootstrapped data, but not for issues
		},

		// Track click events on the nav buttons
		events: {
			"click a.nav.button:not(.disabled)": "displayPage"
		},

	    	//  Change the page (set of 25 issues) you're viewing by updating the collection
	    	displayPage: function(e) {
			var page = ( parseInt(e)==e ? e : e.target.getAttribute('page') );
			Issues.update({ data: {page: page} });
		},

		// Repaginate is called when the app needs to update it's pagination buttons
		repaginate: function(pageInfo) {
			$('.current-page').html(pageInfo.next ? parseInt(pageInfo.next)-1 : parseInt(pageInfo.prev)+1);
			$('.total-pages').html(pageInfo.last=='1' ? parseInt(pageInfo.prev)+1 : pageInfo.last);
			$('.pagination').find('.first').removeClass('disabled').addClass( pageInfo.next=='2'?'disabled':'');
			$('.pagination').find('.prev').attr ('page', pageInfo.prev ).removeClass('disabled').addClass(pageInfo.prev?'':'disabled');
			$('.pagination').find('.next').attr ('page', pageInfo.next ).removeClass('disabled').addClass(pageInfo.next?'':'disabled');
			$('.pagination').find('.last').attr ('page', pageInfo.last ).removeClass('disabled').addClass(pageInfo.last=='1'?'disabled':'');
			$('#issue-list,.pagination,interface,#footer').show();

			// Also update the location hash so we can viscerly see where we are, and bookmark as well
			var link = window.location.href.replace(/#.*/,'')+'#'+(pageInfo.next ? parseInt(pageInfo.next)-1 : parseInt(pageInfo.prev)+1);
			window.location.replace(link);
		},

		// Sync is called when the Issues collection is synced (i.e. new issues arrived)
		sync: function() {

			// Clean the issue table of issues
			this.$("#issue-list tbody tr").remove();

			// and render new views from the issues collection and append to the table
			Issues.each( function(issue) {
				var view = new IssueView({model: issue});
				this.$("#issue-list").append(view.render().el);
			}, this);
		},

		// Some app rendering is actually done during repagination, but the last bit is to stripe the issues table after it's synced
		render: function() {
			$('table tr').removeClass('odd');
			$('table tr:odd').addClass('odd');
			return this;
		}

	});

	// Create our issues collection and run the app!
	var Issues = new IssueCollection;
	var App = new AppView;

});
