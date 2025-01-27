import React, { useState, useEffect } from 'react';
import axios from './axios.js';

function DocumentList({ selectionHandler, handleTemplateValue, config }) {
  const [documents, setDocuments] = useState([]);
  const [newFileData, setNewFileData] = useState(null);
  const [showCreateDocumentInput, setShowCreateDocumentInput] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [templateSelected, setTemplateSelected] = useState('');

  const handleCreateDocumentInput = () => {
    setShowCreateDocumentInput(!showCreateDocumentInput);
  };

  const handleShowTemplates = () => {
    setShowTemplates(!showTemplates);
  };

  //Retrieving documentList from database and sorting by modifiedDate descending
  //then by Id descending
  async function fetchDocuments() {
    const documentList = await axios.get('/documents/user', config).then(response => {
      setDocuments(response.data);
    });
    return documentList;
  }

  //Posts document to S3 bucket with unique key and blank data
  async function addFileToBucket(data) {
    let newDocument = await axios
      .post(
        '/documents/data',
        {
          key: data.s3key,
          data: '',
        },
        config
      )
      .then(response => {
        console.log(response.data);
      });
    return newDocument;
  }

  //Called when DocumentList loads and when config is updated
  useEffect(() => {
    if (config) {
      fetchDocuments();
    }
  }, [config]);

  //Called when DocumentList loads and when newFileData is updated
  useEffect(() => {
    if (newFileData) {
      addFileToBucket(newFileData);
    }
  }, [newFileData]);

  const getBearerToken = () => {
    var authToken = localStorage.getItem('jhi-authenticationToken') || sessionStorage.getItem('jhi-authenticationToken');
    if (authToken) {
      authToken = JSON.parse(authToken);
      return { headers: { accept: '*/*', Authorization: `Bearer ${authToken}` } };
    }
    return null;
  };

  //Sets initial values for document then passes new document data to editor
  async function handleCreateDocument(e) {
    const newConfig = getBearerToken();
    e.preventDefault();
    let newDocument = await axios
      .post(
        '/documents',
        {
          documentTitle: e.target[0].value,
          createdDate: new Date().toISOString().substring(0, 10),
          modifiedDate: new Date().toISOString().substring(0, 10),
          s3key: e.target[0].value,
          userName: null,
        },
        newConfig
      )
      .then(response => {
        selectionHandler(response.data);
        if (templateSelected !== '') {
          handleTemplateValue(templateSelected);
        }
        setNewFileData(response.data);
      });
  }

  return (
    <div className="document-list gutters">
      {!showCreateDocumentInput && (
        <div className="flex flex-end">
          <button
            className="btn btn-outline-info btn-template"
            onClick={() => {
              handleCreateDocumentInput();
              handleShowTemplates();
            }}
          >
            New From Template
          </button>
          <button className="btn btn-outline-info" onClick={handleCreateDocumentInput}>
            New Blank Document
          </button>
        </div>
      )}
      {showCreateDocumentInput && (
        <form onSubmit={handleCreateDocument}>
          <input className="form-control me-2" name="newDocumentName" placeholder="document name" />
          <button type="submit" className="btn btn-outline-info">
            Create Document
          </button>
        </form>
      )}

      {showTemplates && (
        <div className="flex">
          <div
            className={`card pointer p-2 ${templateSelected === 'Letter' ? 'selected' : ''}`}
            onClick={() => (templateSelected === 'Letter' ? setTemplateSelected('') : setTemplateSelected('Letter'))}
          >
            <img src="../../content/images/letter.png" className="card-img-top" alt="..." />
            <div className="card-body-custom">
              <h5 className="card-title">Letter</h5>
            </div>
          </div>
          <div
            className={`card pointer p-2 ${templateSelected === 'Resume' ? 'selected' : ''}`}
            onClick={() => (templateSelected === 'Resume' ? setTemplateSelected('') : setTemplateSelected('Resume'))}
          >
            <img src="../../content/images/resume.png" className="card-img-top" alt="..." />
            <div className="card-body-custom">
              <h5 className="card-title">Resume</h5>
            </div>
          </div>
          <div
            className={`card pointer p-2 ${templateSelected === 'Meeting' ? 'selected' : ''}`}
            onClick={() => (templateSelected === 'Meeting' ? setTemplateSelected('') : setTemplateSelected('Meeting'))}
          >
            <img src="../../content/images/meeting.png" className="card-img-top" alt="..." />
            <div className="card-body-custom">
              <h5 className="card-title">Meeting Notes</h5>
            </div>
          </div>
        </div>
      )}

      <table className="table table-striped table-hover">
        <thead className="table-dark">
          <tr>
            <th>Document Title</th>
            <th>Last Modified</th>
            <th>Owner</th>
          </tr>
        </thead>
        <tbody>
          {documents &&
            documents.map(documentRow => (
              <tr key={documentRow.id} onClick={() => selectionHandler(documentRow)} className="row-clickable">
                <td>{documentRow.documentTitle}</td>
                <td>{documentRow.modifiedDate}</td>
                <td>{documentRow.userName.login}</td>
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  );
}

export default DocumentList;
