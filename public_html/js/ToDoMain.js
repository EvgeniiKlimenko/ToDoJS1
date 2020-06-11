/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
class Model {
    constructor() {
        this.todosAr = JSON.parse(localStorage.getItem('todosAr')) || [];
    }
    
    bindTodoListChanged(callback) {
        this.onTodoListChanged = callback;
    }
    
    _commit(todosAr){
        this.onTodoListChanged(todosAr);
        localStorage.setItem('todosAr', JSON.stringify(todosAr));
    }

    addTodo(todoText) {
        const newTodo = {
            id: this.todosAr.length > 0 ? this.todosAr[this.todosAr.length - 1].id + 1 : 1, // if length > 0, take the last index of array and +1
            text: todoText,
            complete: false
        };
        this.todosAr.push(newTodo);
        this._commit(this.todosAr);
    }

    // Map through all todos, and replace the text of the todo with the specified id
    editTodo(id, updateText) {
        this.todosAr = this.todosAr.map(todo =>
            todo.id === id ? {id: todo.id, text: updateText, complete: todo.complete} : todo);
        this._commit(this.todosAr);
    }

    // Filter a todo out of the array by id
    deleteTodo(id) {
        this.todosAr = this.todosAr.filter(todo => todo.id !== id); // leave all todos, where todo.id !== id
        this._commit(this.todosAr);
    }

    //Switch the complete boolean by id (complete task)
    toggleTodo(id) {
        this.todosAr = this.todosAr.map(todo =>
            todo.id === id ? {id: todo.id, text: todo.text, complete: !todo.complete} : todo);
        this._commit(this.todosAr);
    }
    
    
        
}


//-----------------------||
class View {
    constructor() {
        this.app = this.getElement('#root');

        this.title = this.createElement('h1');
        this.title.textContent = 'Todos app!';

        this.form = this.createElement('form');

        this.input = this.createElement('input');
        this.input.type = 'text';
        this.input.placeholder = 'Add a new task';
        this.input.name = 'todo';

        this.submitButton = this.createElement('button');
        this.submitButton.textContent = 'Create';

        this.todoList = this.createElement('ul', 'todo-list');

        this.form.append(this.input, this.submitButton);

        this.app.append(this.title, this.form, this.todoList);
        
        this._temporaryTodoText;    // temporary todo text property. For todo editing purpose
        this._initLocalListeners();
    }

    get _todoText() {
        return this.input.value;
    }

    _resetInput() {
        this.input.value = '';
    }

// Update temporary state
    _initLocalListeners() {
        this.todoList.addEventListener('input', event => {
            if(event.target.className === 'editable') {
                this._temporaryTodoText = event.target.innerText;
            }
        });
    }





//Utility method to create an element (with an optional CSS class)
    createElement(tag, className) {
        const element = document.createElement(tag);    // creating new element with tag name
        if (className) {                          // if className isn't empty...
            element.classList.add(className);   // add to document's class list new class
        }
        return element;
    }
//Utility method to get element from page by selector
    getElement(selector) {
        var element = document.querySelector(selector);     // find element by selector
        return element;
    }

// Method to display all tasks:
    displayTodos(todosAr) {
        // delete all node first
        while (this.todoList.firstChild) {   // todolist is an 'ul' element, not an array!!!
            this.todoList.removeChild(this.todoList.firstChild);
        }

        // show default message, if todoArray is empty
        if (todosAr.length === 0) {
            const defElement = this.createElement('p');
            defElement.textContent = 'Nothing to do. Add a task.';
            this.todoList.append(defElement);
        } else {    // if array of todos isn't empty
            // Create todo item nodes for each todo in todoAr array
            todosAr.forEach(todo => {
                const li = this.createElement('li');
                li.id = todo.id;    // set id = "todo.id" for the html element <li>

                //now we will create a content of each todo node
                // Each todo item will have a checkbox you can toggle
                const checkbox = this.createElement('input');
                checkbox.type = 'checkbox';
                checkbox.checked = todo.complete;

                // The todo item text will be in a contenteditable span
                const span = this.createElement('span');
                span.contentEditable = true;
                span.classList.add('editable');

                // If the todo is complete, it will have a strikethrough
                if (todo.complete) {
                    const strike = this.createElement('s');
                    strike.textContent = todo.text;
                    span.append(strike);
                } else {
                    // Otherwise just display the text
                    span.textContent = todo.text;
                }
                
                const deleteButton = this.createElement('button', 'delete');
                deleteButton.textContent = 'Delete';
                
                // And then, add all created content to the <li> element:
                li.append(checkbox, span, deleteButton);
                
                // And now <li> element is finished. Add it to the list of todo:
                this.todoList.append(li);
            });
        }

    }
    
// Adding event listeners. Bind event handlers from Controller with View:
// Listening for submit, click and checkbox change events
    bindAddTodo(handler) {
        this.form.addEventListener('submit', event => {
           event.preventDefault();  // what is this?
           if(this._todoText) {
               handler(this._todoText);
               this._resetInput();
           }
        });
    }
    
    // Send the completed value to the model on focusout event
    bindEditTodo(handler) {
        this.todoList.addEventListener('focusout', event => {
            if(this._temporaryTodoText) {
                const id = parseInt(event.target.parentElement.id);
                handler(id, this._temporaryTodoText); // call handler from argument
                this._temporaryTodoText = '';   // reset to empty text
            }
        });
    }
    
    bindDeleteTodo(handler) {
        this.todoList.addEventListener('click', event => {
            if(event.target.className === 'delete'){    // 'delete' is a class of every delete buttons in every todo node
                const id = parseInt(event.target.parentElement.id);
                handler(id);
        }
        });
    }
    
    bindToggleTodo(handler) {
        this.todoList.addEventListener('change', event => {
           if(event.target.type === 'checkbox') {
               const id = parseInt(event.target.parentElement.id);
               handler(id);
           } 
        });
    }

}


//------------------------||
class Controller {
    constructor(model, view) {
        this.model = model; // create a property named model (Controller.model)
        this.view = view;
                
        this.model.bindTodoListChanged(this.onTodoListChanged);
        this.view.bindAddTodo(this.handleAddTodo);
        this.view.bindEditTodo(this.handleEditTodo);
        this.view.bindDeleteTodo(this.handleDeleteTodo);
        this.view.bindToggleTodo(this.handleToggleTodo);
        this.onTodoListChanged(this.model.todosAr); //call function to display initial todos on start.
    }
    
    // On List changed - redisplay all list
    onTodoListChanged = todosAr => {    // here todosAr is incoming argument of function
        this.view.displayTodos(todosAr);    // and do some actions using this argument (this todosAr)
    };
    
    
// Handlers of events here, calling Model's methods:
    handleAddTodo = todoText => {
        this.model.addTodo(todoText);
    };
    
    handleEditTodo = (id, updateText) => {
        this.model.editTodo(id, updateText);
    };
    
    handleDeleteTodo = id => {
        this.model.deleteTodo(id);
    };
    
    handleToggleTodo = id => {
        this.model.toggleTodo(id);
    };
    
    
}

const app = new Controller(new Model(), new View());
